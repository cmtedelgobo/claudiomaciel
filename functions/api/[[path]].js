// Cloudflare Pages Function — binding required: DB (Cloudflare D1)
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const fail=(message,status=400)=>json({error:message},status);
const n=(v,def=0)=>{const x=Number(v);return Number.isFinite(x)?Math.trunc(x):def;};
const str=(v,max=200)=>String(v??'').trim().slice(0,max);
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T12:00:00Z'));
const sql=(db,q,...args)=>db.prepare(q).bind(...args);
const get=(db,q,...a)=>sql(db,q,...a).first();
const all=async(db,q,...a)=>(await sql(db,q,...a).all()).results;
const run=(db,q,...a)=>sql(db,q,...a).run();
const monthValid=s=>/^\d{4}-(0[1-9]|1[0-2])$/.test(s);
const idOf=(x)=>{let a=n(x);if(a<=0)throw Error('ID inválido');return a};
function needs(b,k){if(!b||b[k]===undefined||b[k]===null)throw Error('Campo obrigatório: '+k)}
async function components(db,productId,presentationId,quantity){
  let p=await get(db,'SELECT * FROM products WHERE id=? AND active=1',productId);if(!p)throw Error('Produto não encontrado ou inativo');
  if(quantity<1||quantity>10000)throw Error('Quantidade inválida');
  let unitPrice=p.price,units=1,pres=null;
  if(presentationId){pres=await get(db,'SELECT * FROM presentations WHERE id=? AND product_id=? AND active=1',presentationId,productId);if(!pres)throw Error('Apresentação inválida');unitPrice=pres.price;units=pres.quantity;}
  if(unitPrice<=0)throw Error('Defina um preço de venda maior que zero para '+p.name);
  let list=[],unitCost=0;
  if(p.kind==='recipe'){
    if(presentationId)throw Error('Receitas não aceitam apresentação alternativa');
    const recipes=await all(db,'SELECT r.ingredient_id,r.quantity,p.stock,p.cost,p.active,p.name FROM recipes r JOIN products p ON p.id=r.ingredient_id WHERE r.product_id=?',p.id);
    if(!recipes.length)throw Error('Cadastre os ingredientes da receita antes de vendê-la');
    for(const r of recipes){if(!r.active)throw Error('Ingrediente inativo: '+r.name);list.push({id:r.ingredient_id,qty:r.quantity*quantity,name:r.name});unitCost+=r.quantity*r.cost;}
  }else{list.push({id:p.id,qty:units*quantity,name:p.name});unitCost=p.cost*units;}
  const merged=new Map();for(const l of list)merged.set(l.id,(merged.get(l.id)||0)+l.qty);
  for(const [id,qty] of merged){const inv=await get(db,'SELECT name,stock FROM products WHERE id=?',id);if(!inv||inv.stock<qty)throw Error('Estoque insuficiente para '+(inv?.name||'ingrediente')+' (disponível: '+(inv?.stock||0)+')');}
  return {p,pres,unitPrice,unitCost,components:Array.from(merged).map(([id,qty])=>({id,qty})),quantity};
}
const inventoryStmts=(db,parts,sign,reason,ref)=>parts.map(a=>sql(db,'UPDATE products SET stock=stock+? WHERE id=?',sign*a.qty,a.id)).concat(parts.map(a=>sql(db,'INSERT INTO stock_movements(product_id,change_qty,reason,reference) VALUES(?,?,?,?)',a.id,sign*a.qty,reason,ref)));
async function itemParts(db,item){let p=await get(db,'SELECT kind FROM products WHERE id=?',item.product_id);let units=1;
  if(item.presentation_id){let v=await get(db,'SELECT quantity FROM presentations WHERE id=?',item.presentation_id);if(v)units=v.quantity;}
  if(p?.kind==='recipe'){let rec=await all(db,'SELECT ingredient_id,quantity FROM recipes WHERE product_id=?',item.product_id);return rec.map(r=>({id:r.ingredient_id,qty:r.quantity*item.quantity}));}
  return [{id:item.product_id,qty:units*item.quantity}];
}
export async function onRequest(context){
  if(context.request.method==='OPTIONS')return new Response(null,{status:204});
  let db=context.env.DB;if(!db)return fail('Banco D1 não conectado: configure o binding DB no Cloudflare Pages.',503);
  let path=context.params.path;path=Array.isArray(path)?path.join('/'):String(path||'');
  let method=context.request.method;
  let url=new URL(context.request.url);
  let b={};if(method!=='GET'){try{b=await context.request.json()}catch{return fail('Corpo JSON inválido')}}
  try{
    if(path==='health'&&method==='GET'){await get(db,'SELECT 1 as ok');return json({ok:true});}
    if(path==='bootstrap'&&method==='GET'){
      let [products,customers,orders,payables,balances]=await Promise.all([
        all(db,'SELECT * FROM products ORDER BY favorite DESC,name'),all(db,'SELECT c.*,COALESCE((SELECT SUM(amount) FROM customer_ledger l WHERE l.customer_id=c.id),0) debt FROM customers c ORDER BY name'),all(db,"SELECT o.*,c.name customer_name,CASE WHEN o.status='paid' THEN o.total ELSE COALESCE((SELECT SUM(amount) FROM order_payments WHERE order_id=o.id),0) END paid_amount FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='open' ORDER BY o.id DESC"),all(db,'SELECT * FROM payables ORDER BY status,due_date,id DESC'),get(db,"SELECT COALESCE(SUM(CASE WHEN type IN ('income','opening') THEN amount ELSE -amount END),0) total FROM cash_entries")]);
      return json({products,customers,orders,payables,balance:balances?.total||0});
    }
    if(path==='products'&&method==='POST'){
      needs(b,'name');let kind=str(b.kind||'simple');if(!['simple','ingredient','recipe'].includes(kind))throw Error('Tipo inválido');
      let unit=str(b.unit||'un');if(!['un','ml','g'].includes(unit))throw Error('Unidade inválida');
      const cost=n(b.cost),price=n(b.price),min=n(b.min_stock);if(cost<0||price<0||min<0)throw Error('Valores inválidos');
      let r=await run(db,'INSERT INTO products(name,category,kind,unit,stock,min_stock,cost,price,favorite) VALUES(?,?,?,?,?,?,?,?,?)',str(b.name),str(b.category||'OUTROS'),kind,unit,Math.max(0,n(b.stock)),min,cost,price,b.favorite?1:0);return json({id:r.meta.last_row_id});
    }
    if(path==='products'&&method==='DELETE'){
      const id=idOf(b.id),p=await get(db,'SELECT * FROM products WHERE id=?',id);
      if(!p)throw Error('Produto não encontrado');
      const used=await get(db,'SELECT (SELECT COUNT(*) FROM sale_items WHERE product_id=?) + (SELECT COUNT(*) FROM recipes WHERE product_id=? OR ingredient_id=?) + (SELECT COUNT(*) FROM presentations WHERE product_id=?) AS total',id,id,id,id);
      if(used.total){await run(db,'UPDATE products SET active=0 WHERE id=?',id);return json({ok:true,archived:true});}
      await db.batch([sql(db,'DELETE FROM stock_movements WHERE product_id=?',id),sql(db,'DELETE FROM products WHERE id=?',id)]);
      return json({ok:true});
    }
    if(path==='products'&&method==='PUT'){
      let id=idOf(b.id),p=await get(db,'SELECT * FROM products WHERE id=?',id);if(!p)throw Error('Produto inexistente');
      let price=n(b.price),cost=n(b.cost);if(price<0||cost<0)throw Error('Valores inválidos');
      const desired=b.stock===undefined?p.stock:n(b.stock),delta=desired-p.stock;
      if(desired<0||desired>10000000)throw Error('Estoque inválido');
      await db.batch([sql(db,'UPDATE products SET name=?,category=?,price=?,cost=?,min_stock=?,active=?,favorite=? WHERE id=?',str(b.name||p.name),str(b.category||p.category),price,cost,Math.max(0,n(b.min_stock)),b.active===false?0:1,b.favorite?1:0,id),...(delta?[sql(db,'UPDATE products SET stock=stock+? WHERE id=?',delta,id),sql(db,'INSERT INTO stock_movements(product_id,change_qty,reason) VALUES(?,?,?)',id,delta,'Edição de produto')]:[])]);
      return json({ok:true});
    }
    if(path==='suppliers'&&method==='GET')return json(await all(db,'SELECT * FROM suppliers ORDER BY name'));
    if(path==='suppliers'&&method==='POST'){
      if(!str(b.name))throw Error('Nome do fornecedor obrigatório');
      const r=await run(db,'INSERT INTO suppliers(name,contact,phone,email,notes) VALUES(?,?,?,?,?)',str(b.name),str(b.contact),str(b.phone),str(b.email),str(b.notes,1000));return json({id:r.meta.last_row_id});
    }
    if(path==='suppliers'&&method==='PUT'){
      if(!str(b.name))throw Error('Nome obrigatório');
      await run(db,'UPDATE suppliers SET name=?,contact=?,phone=?,email=?,notes=? WHERE id=?',str(b.name),str(b.contact),str(b.phone),str(b.email),str(b.notes,1000),idOf(b.id));return json({ok:true});
    }
    if(path==='suppliers'&&method==='DELETE'){
      await run(db,'DELETE FROM suppliers WHERE id=?',idOf(b.id));return json({ok:true});
    }
    if(path==='presentations'&&method==='GET')return json(await all(db,'SELECT a.*,p.name product_name FROM presentations a JOIN products p ON p.id=a.product_id ORDER BY p.name,a.name'));
    if(path==='presentations'&&method==='POST'){
      let id=idOf(b.product_id),q=n(b.quantity),price=n(b.price);if(!str(b.name)||q<=0||price<0)throw Error('Apresentação inválida');
      const r=await run(db,'INSERT INTO presentations(product_id,name,quantity,price) VALUES(?,?,?,?)',id,str(b.name),q,price);return json({id:r.meta.last_row_id});
    }
    if(path==='recipes'&&method==='GET')return json(await all(db,'SELECT r.*,p.name product_name,i.name ingredient_name FROM recipes r JOIN products p ON p.id=r.product_id JOIN products i ON i.id=r.ingredient_id ORDER BY p.name'));
    if(path==='recipes'&&method==='POST'){
      let pid=idOf(b.product_id),iid=idOf(b.ingredient_id),qty=n(b.quantity);
      if(pid===iid||qty<=0)throw Error('Ingrediente/quantidade inválidos');let p=await get(db,'SELECT kind FROM products WHERE id=?',pid);if(p?.kind!=='recipe')throw Error('Produto principal precisa ser uma receita');
      let ingredient=await get(db,'SELECT kind FROM products WHERE id=?',iid);if(!ingredient||ingredient.kind==='recipe')throw Error('Ingrediente inválido');
      await run(db,'INSERT INTO recipes(product_id,ingredient_id,quantity) VALUES(?,?,?) ON CONFLICT(product_id,ingredient_id) DO UPDATE SET quantity=excluded.quantity',pid,iid,qty);return json({ok:true});
    }
    if(path==='recipes'&&method==='DELETE'){await run(db,'DELETE FROM recipes WHERE product_id=? AND ingredient_id=?',idOf(b.product_id),idOf(b.ingredient_id));return json({ok:true});}
    if(path==='stock'&&method==='POST'){
      const id=idOf(b.product_id),delta=n(b.quantity),cost=n(b.unit_cost);if(!delta||Math.abs(delta)>10000000||cost<0)throw Error('Quantidade ou custo inválido');
      let p=await get(db,'SELECT stock FROM products WHERE id=?',id);if(!p||p.stock+delta<0)throw Error('Estoque insuficiente');
      let stmts=[sql(db,'UPDATE products SET stock=stock+?,cost=CASE WHEN ? >=0 AND ? >0 THEN ? ELSE cost END WHERE id=?',delta,delta,cost,cost,id),sql(db,'INSERT INTO stock_movements(product_id,change_qty,reason,reference,unit_cost) VALUES(?,?,?,?,?)',id,delta,str(b.reason||'Ajuste de estoque'),str(b.reference||''),cost)];await db.batch(stmts);return json({ok:true});
    }
    if(path==='customers'&&method==='POST'){
      if(!str(b.name))throw Error('Nome obrigatório');let limit=n(b.credit_limit);if(limit<0)throw Error('Limite inválido');
      let r=await run(db,'INSERT INTO customers(name,nickname,phone,cpf,credit_limit,blocked) VALUES(?,?,?,?,?,?)',str(b.name),str(b.nickname),str(b.phone),str(b.cpf),limit,b.blocked?1:0);return json({id:r.meta.last_row_id});
    }
    if(path==='customers'&&method==='PUT'){
      let id=idOf(b.id),limit=n(b.credit_limit);if(limit<0||!str(b.name))throw Error('Dados inválidos');
      await run(db,'UPDATE customers SET name=?,nickname=?,phone=?,cpf=?,credit_limit=?,blocked=? WHERE id=?',str(b.name),str(b.nickname),str(b.phone),str(b.cpf),limit,b.blocked?1:0,id);return json({ok:true});
    }
    if(path==='orders'&&method==='POST'){
      let id=idOf(b.customer_id),c=await get(db,'SELECT id FROM customers WHERE id=?',id);if(!c)throw Error('Cliente não encontrado');
      let r=await run(db,"INSERT INTO orders(customer_id) VALUES(?)",id);return json({id:r.meta.last_row_id});
    }
    if(path==='order-items'&&method==='GET')return json(await all(db,'SELECT * FROM sale_items WHERE order_id=? OR sale_id IN (SELECT id FROM sales WHERE order_id=?) ORDER BY id',idOf(url.searchParams.get('order_id')),idOf(url.searchParams.get('order_id'))));
    if(path==='order-items'&&method==='POST'){
      let oid=idOf(b.order_id),o=await get(db,'SELECT * FROM orders WHERE id=?',oid);if(o?.status!=='open')throw Error('Comanda não está aberta');
      let p=await components(db,idOf(b.product_id),b.presentation_id? idOf(b.presentation_id):null,n(b.quantity,1));
      let total=p.unitPrice*p.quantity;
      let c=await get(db,'SELECT * FROM customers WHERE id=?',o.customer_id);
      let debt=await get(db,'SELECT COALESCE(SUM(amount),0) d FROM customer_ledger WHERE customer_id=?',o.customer_id);
      // Alert only: the limit is enforced at fiado closure; cash payments remain possible.
      const statements=[sql(db,'INSERT INTO sale_items(order_id,product_id,presentation_id,name,quantity,unit_price,unit_cost) VALUES(?,?,?,?,?,?,?)',oid,p.p.id,p.pres?.id||null,p.pres?p.p.name+' — '+p.pres.name:p.p.name,p.quantity,p.unitPrice,p.unitCost),sql(db,'UPDATE orders SET total=total+? WHERE id=?',total,oid),...inventoryStmts(db,p.components,-1,'Consumo em comanda',`order:${oid}`)];
      await db.batch(statements);return json({ok:true,credit_warning:c.blocked||debt.d+o.total+total>c.credit_limit});
    }
    if(path==='order-items'&&method==='DELETE'){
      let iid=idOf(b.item_id),item=await get(db,'SELECT i.*,o.status FROM sale_items i JOIN orders o ON o.id=i.order_id WHERE i.id=?',iid);if(item?.status!=='open')throw Error('Item não pode ser removido');
      let paid=await get(db,'SELECT COALESCE(SUM(amount),0) v FROM order_payments WHERE order_id=?',item.order_id);let original=await get(db,'SELECT total FROM orders WHERE id=?',item.order_id);if(original.total-item.quantity*item.unit_price<paid.v)throw Error('Não é possível remover item: valor ficaria abaixo do que foi pago');let parts=await itemParts(db,item);await db.batch([sql(db,'DELETE FROM sale_items WHERE id=?',iid),sql(db,'UPDATE orders SET total=total-? WHERE id=?',item.quantity*item.unit_price,item.order_id),...inventoryStmts(db,parts,1,'Estorno de comanda',`order:${item.order_id}`)]);return json({ok:true});
    }
    if(path==='orders/cancel'&&method==='POST'){
      let oid=idOf(b.order_id),o=await get(db,'SELECT * FROM orders WHERE id=?',oid);if(o?.status!=='open')throw Error('Comanda não está aberta');
      const cp=await get(db,'SELECT COALESCE(SUM(amount),0) v FROM order_payments WHERE order_id=?',oid);if(cp.v>0)throw Error('Comanda com pagamento não pode ser cancelada sem estorno manual.');
      let items=await all(db,'SELECT * FROM sale_items WHERE order_id=?',oid),parts=[];for(const item of items)parts.push(...await itemParts(db,item));
      await db.batch([sql(db,"UPDATE orders SET status='cancelled',closed_at=CURRENT_TIMESTAMP WHERE id=?",oid),...inventoryStmts(db,parts,1,'Comanda cancelada',`order:${oid}`)]);return json({ok:true});
    }
    if(path==='orders/all'&&method==='GET')return json(await all(db,"SELECT o.*,c.name customer_name,CASE WHEN o.status='paid' THEN o.total ELSE COALESCE((SELECT SUM(amount) FROM order_payments WHERE order_id=o.id),0) END paid_amount FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY o.id DESC LIMIT 500"));
    if(path==='orders/payments'&&method==='GET')return json(await all(db,'SELECT * FROM order_payments WHERE order_id=? ORDER BY id',idOf(url.searchParams.get('order_id'))));
    if(path==='orders/payment'&&method==='POST'){
      const oid=idOf(b.order_id),amount=n(b.amount),payMethod=str(b.method),note=str(b.note,300);
      if(amount<=0||!['cash','pix','debit','credit'].includes(payMethod))throw Error('Pagamento inválido');
      const o=await get(db,"SELECT * FROM orders WHERE id=? AND status='open'",oid);if(!o)throw Error('Comanda não está aberta');
      const old=await get(db,'SELECT COALESCE(SUM(amount),0) total FROM order_payments WHERE order_id=?',oid);
      if(amount>o.total-old.total)throw Error('Valor supera o saldo pendente da comanda');
      await db.batch([sql(db,'INSERT INTO order_payments(order_id,amount,method,note) VALUES(?,?,?,?)',oid,amount,payMethod,note),sql(db,'INSERT INTO cash_entries(customer_id,type,method,amount,note) VALUES(?,?,?,?,?)',o.customer_id,'income',payMethod,amount,'Pagamento parcial da comanda #'+oid+(note?' — '+note:''))]);
      return json({ok:true,paid:old.total+amount,balance:o.total-old.total-amount});
    }
    if(path==='receivables/orders'&&method==='GET')return json(await all(db,"SELECT o.id,o.customer_id,c.name customer_name,o.status,o.total,COALESCE((SELECT SUM(amount) FROM order_payments WHERE order_id=o.id),0) paid, o.total-COALESCE((SELECT SUM(amount) FROM order_payments WHERE order_id=o.id),0) balance FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.status='open' ORDER BY o.id DESC"));
    if(path==='backup'&&method==='GET'){
      const names=['customers','products','presentations','recipes','orders','sales','sale_items','manual_sale_items','order_payments','stock_movements','cash_entries','customer_ledger','payables','suppliers'];const data={format:'crm-conveniencia-backup',version:'1.2.0',created_at:new Date().toISOString(),tables:{}};
      for(const name of names)data.tables[name]=await all(db,`SELECT * FROM ${name}`);
      return json(data);
    }
    if(path==='orders/close'&&method==='POST'){
      const oid=idOf(b.order_id),o=await get(db,'SELECT * FROM orders WHERE id=?',oid);if(o?.status!=='open')throw Error('Comanda não está aberta');
      const items=await all(db,'SELECT * FROM sale_items WHERE order_id=?',oid);if(!items.length)throw Error('Comanda vazia');
      const pm=await get(db,'SELECT COALESCE(SUM(amount),0) paid,COUNT(*) count FROM order_payments WHERE order_id=?',oid);
      const rest=o.total-pm.paid;if(rest<0)throw Error('Pagamentos excedem o valor da comanda');
      let method=str(b.method||'cash');if(!['cash','pix','debit','credit','fiado'].includes(method))throw Error('Forma de pagamento inválida');
      const c=await get(db,'SELECT * FROM customers WHERE id=?',o.customer_id);
      if(rest>0&&method==='fiado'){
        let d=await get(db,'SELECT COALESCE(SUM(amount),0) debt FROM customer_ledger WHERE customer_id=?',o.customer_id);
        if(c.blocked||d.debt+rest>c.credit_limit)throw Error('Limite de fiado excedido ou cliente bloqueado');
      }
      const paidType=rest===0?'paid':method==='fiado'?'credit':'paid';
      const stmts=[sql(db,'INSERT INTO sales(order_id,customer_id,total,payment_method) VALUES(?,?,?,?)',oid,o.customer_id,o.total,rest&&method==='fiado'?'fiado':pm.paid?'mixed':method),sql(db,'UPDATE orders SET status=?,closed_at=CURRENT_TIMESTAMP WHERE id=?',paidType,oid),sql(db,'UPDATE sale_items SET sale_id=(SELECT id FROM sales WHERE order_id=? ORDER BY id DESC LIMIT 1),order_id=NULL WHERE order_id=?',oid,oid)];
      if(rest>0&&method==='fiado')stmts.push(sql(db,'INSERT INTO customer_ledger(customer_id,sale_id,amount,description,due_date) VALUES(?,(SELECT id FROM sales WHERE order_id=? ORDER BY id DESC LIMIT 1),?,?,?)',o.customer_id,oid,rest,'Fiado comanda #'+oid,validDate(b.due_date)?b.due_date:null));
      else if(rest>0){stmts.push(sql(db,'INSERT INTO cash_entries(customer_id,type,method,amount,note) VALUES(?,?,?,?,?)',o.customer_id,'income',method,rest,'Quitação da comanda #'+oid));stmts.push(sql(db,'INSERT INTO order_payments(order_id,amount,method,note) VALUES(?,?,?,?)',oid,rest,method,'Quitação no fechamento'));}
      await db.batch(stmts);return json({ok:true,paid:pm.paid+(method==='fiado'?0:rest),balance:method==='fiado'?rest:0});
    }
    if(path==='sales/quick'&&method==='POST'){
      if(!Array.isArray(b.items)||b.items.length>100)throw Error('Itens inválidos');let manual=Array.isArray(b.manual)?b.manual:[];if(!b.items.length&&!manual.length)throw Error('Adicione produtos');if(manual.length>100)throw Error('Muitos itens avulsos');let method=str(b.method);
      if(!['cash','pix','debit','credit'].includes(method))throw Error('Pagamento inválido');
      let priced=[],sum=0,parts=[];
      for(let i of b.items){let p=await components(db,idOf(i.product_id),i.presentation_id?idOf(i.presentation_id):null,n(i.quantity));priced.push(p);sum+=p.unitPrice*p.quantity;parts.push(...p.components);}
      let manualItems=[];for(const i of manual){let name=str(i.name),quantity=n(i.qty),price=n(i.price);if(!name||quantity<1||quantity>10000||price<=0||price>100000000)throw Error('Produto avulso inválido');manualItems.push({name,quantity,price});sum+=quantity*price;}if(sum>2000000000)throw Error('Valor total excede o limite');
      const need=new Map();for(let v of parts)need.set(v.id,(need.get(v.id)||0)+v.qty);
      for(let [id,qty] of need){let product=await get(db,'SELECT name,stock FROM products WHERE id=?',id);if(product.stock<qty)throw Error('Estoque insuficiente: '+product.name);}
      const statements=[sql(db,'INSERT INTO sales(total,payment_method) VALUES(?,?)',sum,method)];
      for(let i of manualItems)statements.push(sql(db,'INSERT INTO manual_sale_items(sale_id,name,quantity,unit_price,unit_cost) VALUES((SELECT MAX(id) FROM sales),?,?,?,0)',i.name,i.quantity,i.price));
      for(let p of priced)statements.push(sql(db,'INSERT INTO sale_items(sale_id,product_id,presentation_id,name,quantity,unit_price,unit_cost) VALUES((SELECT MAX(id) FROM sales),?,?,?,?,?,?)',p.p.id,p.pres?.id||null,p.pres?p.p.name+' — '+p.pres.name:p.p.name,p.quantity,p.unitPrice,p.unitCost));
      statements.push(sql(db,'INSERT INTO cash_entries(sale_id,type,method,amount,note) VALUES((SELECT MAX(id) FROM sales),?,?,?,?)','income',method,sum,'Venda rápida'));
      statements.push(...inventoryStmts(db,Array.from(need).map(([id,qty])=>({id,qty})),-1,'Venda rápida','PDV'));
      await db.batch(statements);return json({ok:true,total:sum});
    }
    if(path==='sales/cancel'&&method==='POST'){
      let sid=idOf(b.sale_id),s=await get(db,'SELECT * FROM sales WHERE id=?',sid);if(s?.status!=='active')throw Error('Venda não pode ser estornada');
      let items=await all(db,'SELECT * FROM sale_items WHERE sale_id=?',sid),parts=[];for(let item of items)parts.push(...await itemParts(db,item));
      let stmts=[sql(db,"UPDATE sales SET status='cancelled' WHERE id=?",sid),...inventoryStmts(db,parts,1,'Venda estornada',`sale:${sid}`)];
      if(s.payment_method==='fiado'){
        let ledger=await get(db,'SELECT COALESCE(SUM(amount),0) val FROM customer_ledger WHERE sale_id=?',sid);
        stmts.push(sql(db,'INSERT INTO customer_ledger(customer_id,sale_id,amount,description) VALUES(?,?,?,?)',s.customer_id,sid,-ledger.val,'Estorno de fiado #'+sid));
      }else stmts.push(sql(db,'INSERT INTO cash_entries(sale_id,type,method,amount,note) VALUES(?,?,?,?,?)',sid,'expense',s.payment_method,s.total,'Estorno venda #'+sid));
      await db.batch(stmts);return json({ok:true});
    }
    if(path==='customers/pay'&&method==='POST'){
      const cid=idOf(b.customer_id),amount=n(b.amount),method=str(b.method||'pix');if(amount<=0||!['cash','pix','debit','credit'].includes(method))throw Error('Recebimento inválido');
      const debt=await get(db,'SELECT COALESCE(SUM(amount),0) debt FROM customer_ledger WHERE customer_id=?',cid);if(!debt||amount>debt.debt)throw Error('Valor maior que o saldo devedor');
      let still=amount,stmts=[];
      const sales=await all(db,"SELECT s.id,s.order_id,COALESCE(SUM(l.amount),0) remaining FROM sales s JOIN customer_ledger l ON l.sale_id=s.id WHERE s.customer_id=? AND s.payment_method='fiado' AND s.status='active' GROUP BY s.id,s.order_id HAVING remaining>0 ORDER BY s.id",cid);
      for(const sale of sales){if(!still)break;let paid=Math.min(still,sale.remaining);stmts.push(sql(db,'INSERT INTO customer_ledger(customer_id,sale_id,amount,description) VALUES(?,?,?,?)',cid,sale.id,-paid,'Recebimento fiado comanda #'+sale.order_id));if(paid===sale.remaining&&sale.order_id)stmts.push(sql(db,"UPDATE orders SET status='paid' WHERE id=? AND status='credit'",sale.order_id));still-=paid;}
      if(still>0)stmts.push(sql(db,'INSERT INTO customer_ledger(customer_id,amount,description) VALUES(?,?,?)',cid,-still,'Pagamento de fiado anterior'));
      stmts.push(sql(db,'INSERT INTO cash_entries(customer_id,type,method,amount,note) VALUES(?,?,?,?,?)',cid,'income',method,amount,'Recebimento de fiado'));
      await db.batch(stmts);return json({ok:true});
    }
    if(path==='payables'&&method==='POST'){
      if(!str(b.description)||!validDate(b.due_date)||n(b.amount)<=0)throw Error('Despesa: descrição, vencimento e valor obrigatórios');
      let r=await run(db,'INSERT INTO payables(description,supplier,category,amount,due_date,recurring) VALUES(?,?,?,?,?,?)',str(b.description),str(b.supplier),str(b.category||'Outros'),n(b.amount),b.due_date,b.recurring?1:0);return json({id:r.meta.last_row_id});
    }
    if(path==='payables/pay'&&method==='POST'){
      let id=idOf(b.id),amount=n(b.amount),method=str(b.method||'pix');let p=await get(db,'SELECT * FROM payables WHERE id=?',id);if(!p||p.status==='paid'||amount<=0||amount>p.amount-p.paid_amount)throw Error('Pagamento inválido');
      let newPaid=p.paid_amount+amount;
      await db.batch([sql(db,'UPDATE payables SET paid_amount=?,status=? WHERE id=?',newPaid,newPaid===p.amount?'paid':'open',id),sql(db,'INSERT INTO cash_entries(payable_id,type,method,amount,note) VALUES(?,?,?,?,?)',id,'expense',method,amount,p.description)]);return json({ok:true});
    }
    if(path==='cash/adjust'&&method==='POST'){
      const target=n(b.target),reason=str(b.reason,400),method=str(b.method||'cash');
      if(!Number.isSafeInteger(Number(b.target))||target<0||target>1000000000||reason.length<6)throw Error('Informe novo saldo e justificativa de pelo menos 6 caracteres');
      if(!['cash','pix','debit','credit'].includes(method))throw Error('Forma inválida');
      const current=await get(db,"SELECT COALESCE(SUM(CASE WHEN type IN ('income','opening') THEN amount ELSE -amount END),0) balance FROM cash_entries");
      const delta=target-current.balance;if(!delta)return json({ok:true,delta:0});
      await run(db,'INSERT INTO cash_entries(type,method,amount,note) VALUES(?,?,?,?)',delta>0?'income':'expense',method,Math.abs(delta),'AJUSTE MANUAL: '+reason+' | Saldo anterior '+current.balance+' | Novo saldo '+target);
      return json({ok:true,delta});
    }
    if(path==='cash'&&method==='POST'){
      let amount=n(b.amount),type=str(b.type),method=str(b.method||'cash');if(amount<=0||!['opening','income','expense','adjustment'].includes(type))throw Error('Movimentação inválida');
      await run(db,'INSERT INTO cash_entries(type,method,amount,note) VALUES(?,?,?,?)',type,method,amount,str(b.note));return json({ok:true});
    }
    if(path==='ledger'&&method==='GET')return json(await all(db,'SELECT l.*,c.name FROM customer_ledger l JOIN customers c ON c.id=l.customer_id WHERE (?=0 OR l.customer_id=?) ORDER BY l.id DESC LIMIT 500',n(url.searchParams.get('customer_id')),n(url.searchParams.get('customer_id'))));
    if(path==='cash'&&method==='GET')return json(await all(db,'SELECT c.*,u.name customer_name FROM cash_entries c LEFT JOIN customers u ON u.id=c.customer_id ORDER BY c.id DESC LIMIT 300'));
    if(path==='sales'&&method==='GET')return json(await all(db,'SELECT s.*,c.name customer_name FROM sales s LEFT JOIN customers c ON c.id=s.customer_id ORDER BY s.id DESC LIMIT 150'));
    if(path==='movements'&&method==='GET')return json(await all(db,'SELECT m.*,p.name product_name,p.unit FROM stock_movements m JOIN products p ON p.id=m.product_id ORDER BY m.id DESC LIMIT 200'));
    if(path==='report'&&method==='GET'){
      let month=str(url.searchParams.get('month'));if(!monthValid(month))throw Error('Mês inválido');let start=month+'-01',end=new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7),1)).toISOString().slice(0,10);
      let [sales,items,cash,payables,debts]=await Promise.all([
        get(db,"SELECT COALESCE(SUM(total),0) gross,COUNT(*) count,COALESCE(SUM(CASE WHEN payment_method='fiado' THEN total ELSE 0 END),0) credit FROM sales WHERE status='active' AND date(created_at)>=? AND date(created_at)<?",start,end),
        all(db,"SELECT name,SUM(qty) qty,SUM(revenue) revenue,SUM(cost) cost FROM (SELECT i.name,i.quantity qty,i.quantity*i.unit_price revenue,i.quantity*i.unit_cost cost FROM sale_items i JOIN sales s ON s.id=i.sale_id WHERE s.status='active' AND date(s.created_at)>=? AND date(s.created_at)<? UNION ALL SELECT m.name||' (avulso)',m.quantity,m.quantity*m.unit_price,m.quantity*m.unit_cost FROM manual_sale_items m JOIN sales s ON s.id=m.sale_id WHERE s.status='active' AND date(s.created_at)>=? AND date(s.created_at)<?) GROUP BY name ORDER BY qty DESC",start,end,start,end),
        get(db,"SELECT COALESCE(SUM(CASE WHEN type IN ('income','opening') THEN amount ELSE -amount END),0) net,COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) expense FROM cash_entries WHERE date(created_at)>=? AND date(created_at)<?",start,end),
        get(db,'SELECT COALESCE(SUM(amount),0) obligations,COALESCE(SUM(paid_amount),0) paid FROM payables WHERE due_date>=? AND due_date<?',start,end),
        get(db,'SELECT COALESCE(SUM(amount),0) balance FROM customer_ledger')]);
      return json({month,sales,items,cash,payables,debts});
    }
    return fail('Rota não encontrada: '+path,404);
  }catch(e){return fail(e?.message||'Falha interna',/SQLITE|D1_ERROR/.test(e?.message||'')?500:400)}
}
