(() => {
  const { wordToCap } = window.kgptalkieCaseApi;
  const names = new Set(['customers', 'name', 'status', 'c', 'city', 'orders', 'o', 'sample_shop', 'id', 'email']);
  // [text before the typed char, typed char, expected word or null]
  const CASES = [
    ['select', ' ', 'SELECT'], ['SELECT name from', ' ', 'FROM'], ['select * from customers', ' ', null],
    ['select * from customers c where', ' ', 'WHERE'], ['select c.name', ',', null], ['select name', ' ', null],
    ['select status', ',', null], ['select count', '(', 'COUNT'], ['select count', ' ', null],
    ["select 'select", ' ', null], ['-- select', ' ', null], ['/* from', ' ', null], ['select `from', ' ', null],
    ['select {{country', ' ', null], ['select * from customers as cu', ' ', null],
    ['create table t (id int', ',', 'INT'], ['create table t (id INT, primary', ' ', 'PRIMARY'], ['create table t (id INT, name', ' ', null],
    ['create table if', ' ', 'IF'], ['insert into orders (id', ',', null], ['insert into orders (id, status) values', ' ', 'VALUES'],
    ['select cast(x as char', ')', 'CHAR'], ['select * from orders order by id desc', ';', 'DESC'], ['show tables', ';', 'TABLES'],
    ['use sample_shop', ';', null], ['select * from t limit', '\n', 'LIMIT'], ['select * from t where city is not null', ' ', 'NULL'],
    ['SELECT', ' ', null], ['update orders set', ' ', 'SET'], ['select date', '(', 'DATE'], ['select date', ',', null],
    ['select a from t; select', ' ', 'SELECT'], ['# note select', ' ', null], ['select email', ' ', null],
  ];
  const out = []; let bad = 0;
  for (const [text, typed, want] of CASES) {
    const full = text + typed, hit = wordToCap(full, text.length, typed, names), got = hit ? hit.upper : null;
    if (got !== want) { bad++; out.push('FAIL ' + JSON.stringify(text + typed) + ' -> ' + got + ' (want ' + want + ')'); }
  }
  return JSON.stringify({ total: CASES.length, bad, out }, null, 1);
})()
