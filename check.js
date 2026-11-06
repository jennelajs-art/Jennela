
const KEY='spa.manager.v1';
const expenseCategories=['ค่าเช่า','ค่าน้ำ','ค่าไฟฟ้า','เงินเดือนพนักงาน','ค่าน้ำยา / ครีม','ค่าอุปกรณ์','ค่าขนมลูกค้า','ค่าอาหารพนักงาน','ค่าพนักงานพาร์ตไทม์','ค่าอินเทอร์เน็ต','ค่าโฆษณา','ค่าแม่บ้านทำความสะอาด','ค่าน้ำยาซักผ้า','เจ้าของเบิก','ค่าโทรศัพท์','อื่น ๆ'];
const defaultServices=[{id:1,name:'นวดไทย',price:400,duration:60},{id:2,name:'นวดน้ำมัน',price:700,duration:60},{id:3,name:'นวดเท้า',price:350,duration:60}];
let data=loadData();
function loadData(){try{const d=JSON.parse(localStorage.getItem(KEY))||{};return {bookings:Array.isArray(d.bookings)?d.bookings:[],expenses:Array.isArray(d.expenses)?d.expenses:[],services:Array.isArray(d.services)?d.services:defaultServices,openingBalance:Number(d.openingBalance)||0,monthlyGoal:Number(d.monthlyGoal)||0,yearlyGoal:Number(d.yearlyGoal)||0}}catch{return {bookings:[],expenses:[],services:defaultServices,openingBalance:0,monthlyGoal:0,yearlyGoal:0}}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}
function money(n){return new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',maximumFractionDigits:2}).format(Number(n)||0)}
function today(){return new Date().toISOString().slice(0,10)}
function fmtDate(s){if(!s)return '-';return new Date(s+'T00:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})}
let selectedYear=new Date().getFullYear();
let selectedMonth=new Date().getMonth()+1; // 1-12, 0 means full year
let selectedBookingDate=today();
function isInPeriod(iso){if(!iso)return false;const y=Number(String(iso).slice(0,4)),m=Number(String(iso).slice(5,7));return y===selectedYear&&(selectedMonth===0||m===selectedMonth)}
function periodName(){return selectedMonth===0?'ปี '+(selectedYear+543):new Date(selectedYear,selectedMonth-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})}
function shiftPeriod(delta){if(selectedMonth===0){selectedYear+=delta}else{const d=new Date(selectedYear,selectedMonth-1+delta,1);selectedYear=d.getFullYear();selectedMonth=d.getMonth()+1}renderPeriodViews()}
function setPeriodMode(mode){if(mode==='year')selectedMonth=0;else if(selectedMonth===0)selectedMonth=new Date().getMonth()+1;renderPeriodViews()}
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById('page-'+name).classList.add('active');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===name));document.getElementById('pageTitle').textContent=({dashboard:'ภาพรวมธุรกิจ',bookings:'ตารางจองคิว / รายรับ',expenses:'รายจ่าย',services:'รายการบริการ',settings:'ตั้งค่าระบบ'})[name];if(name==='bookings')renderBookings();if(name==='expenses')renderExpenses()}
document.getElementById('nav').addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b)showPage(b.dataset.page)});
function renderAll(){renderDashboard();renderBookings();renderExpenses();renderServices();renderSettings();populateSelects()}
function renderPeriodViews(){renderDashboard();renderBookings();renderExpenses()}
function renderDashboard(){
 const bookings=data.bookings.filter(x=>isInPeriod(x.date)&&x.status!=='ยกเลิก');
 const expenses=data.expenses.filter(x=>isInPeriod(x.date));
 const income=bookings.filter(x=>x.paid===true).reduce((s,x)=>s+Number(x.amount||0),0);
 const owner=expenses.filter(x=>x.category==='เจ้าของเบิก').reduce((s,x)=>s+Number(x.amount||0),0);
 const total=expenses.filter(x=>x.category!=='เจ้าของเบิก').reduce((s,x)=>s+Number(x.amount||0),0);
 document.getElementById('periodLabel').textContent=periodName();
 const allIncome=data.bookings.filter(x=>x.status!=='ยกเลิก'&&x.paid===true).reduce((s,x)=>s+Number(x.amount||0),0);
 const allExpenses=data.expenses.reduce((s,x)=>s+Number(x.amount||0),0);
 document.getElementById('bankBalance').textContent=money(Number(data.openingBalance||0)+allIncome-allExpenses);
 document.getElementById('monthMode').classList.toggle('active',selectedMonth!==0);
 document.getElementById('yearMode').classList.toggle('active',selectedMonth===0);
 const suffix=selectedMonth===0?'ในปีที่เลือก':'ในเดือนที่เลือก';
 document.getElementById('incomeLabel').textContent='รายรับ'+suffix;
 document.getElementById('expenseLabel').textContent='รายจ่าย'+suffix;
 document.getElementById('profitLabel').textContent='กำไรจากการดำเนินงาน'+suffix;
 document.getElementById('ownerLabel').textContent='เจ้าของเบิก'+suffix;
 document.getElementById('dashIncome').textContent=money(income);
 document.getElementById('dashExpense').textContent=money(total);
 document.getElementById('dashProfit').textContent=money(income-total);
 document.getElementById('dashOwner').textContent=money(owner);
 renderGoalAndChart();
 const re=[...expenses].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 document.getElementById('recentExpenses').innerHTML=re.length?re.map(x=>`<tr><td><b>${esc(x.category)}</b><small>${esc(x.detail||'')}</small></td><td>${fmtDate(x.date)}</td><td class="amount negative">${money(x.amount)}</td></tr>`).join(''):'<tr><td colspan="3" class="empty">ยังไม่มีรายจ่ายในช่วงนี้</td></tr>';
 renderBestSellers();
 const pending=data.bookings.filter(x=>isInPeriod(x.date)&&x.status!=='ยกเลิก'&&x.paid!==true).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));document.getElementById('pendingCount').textContent=pending.length+' รายการ';document.getElementById('pendingList').innerHTML=pending.length?pending.map(x=>`<div class="pending-item"><div><b>${esc(x.customer)}</b><div class="booking-sub">${fmtDate(x.date)} · ${esc(x.service)}</div></div><strong>${money(x.amount)}</strong></div>`).join(''):'<div class="empty">ไม่มีรายการค้างชำระ 🎉</div>';
 syncPeriodControls();
}
function renderBestSellers(){const pool=data.bookings.filter(x=>isInPeriod(x.date)&&x.status!=='ยกเลิก');const counts={};pool.forEach(x=>{const name=String(x.service||'ไม่ระบุบริการ');counts[name]=(counts[name]||0)+1});const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,4);document.getElementById('bestSellerCaption').textContent=selectedMonth===0?'จัดอันดับจากจำนวนการจองทั้งปี':'จัดอันดับจากจำนวนการจองใน'+periodName();document.getElementById('bestSellerList').innerHTML=top.length?top.map(([name,count],i)=>`<div class="pending-item"><div style="display:flex;align-items:center;gap:10px"><strong style="width:28px;height:28px;border-radius:10px;background:var(--brand2);color:var(--brand);display:grid;place-items:center">${i+1}</strong><b>${esc(name)}</b></div><span class="pill">${count} ครั้ง</span></div>`).join(''):'<div class="empty">ยังไม่มีข้อมูลการจองในช่วงเวลานี้</div>'}
function paidIncomeFor(items){return items.filter(x=>x.status!=='ยกเลิก'&&x.paid===true).reduce((t,x)=>t+Number(x.amount||0),0)}
function renderGoalAndChart(){
 const monthIncome=paidIncomeFor(data.bookings.filter(x=>String(x.date||'').slice(0,7)===selectedYear+'-'+String(selectedMonth||new Date().getMonth()+1).padStart(2,'0')));
 const yearIncome=paidIncomeFor(data.bookings.filter(x=>String(x.date||'').slice(0,4)===String(selectedYear)));
 const yearly=selectedMonth===0,earned=yearly?yearIncome:monthIncome,target=Number(yearly?data.yearlyGoal:data.monthlyGoal)||0,pct=target>0?Math.min(100,earned/target*100):0;
 document.getElementById('goalPeriodName').textContent=yearly?'เป้าหมายประจำปี '+(selectedYear+543):'เป้าหมายประจำเดือน '+periodName();
 document.getElementById('goalBadge').textContent=(target?Math.floor(earned/target*100):0)+'%';
 document.getElementById('goalProgressText').textContent=money(earned)+' / '+money(target);
 document.getElementById('goalProgressBar').style.width=pct+'%';
 document.getElementById('goalEarnedText').textContent='ทำได้แล้ว '+money(earned);
 document.getElementById('goalRemainText').textContent=target>earned?'เหลือ '+money(target-earned):target?'เกินเป้า '+money(earned-target):'ตั้งเป้าหมายเพื่อเริ่มติดตาม';
 document.querySelectorAll('.achievement').forEach(el=>el.classList.toggle('reached',target>0&&earned/target*100>=Number(el.dataset.ach)));
 const mi=document.getElementById('monthlyGoalInput'),yi=document.getElementById('yearlyGoalInput');if(mi&&document.activeElement!==mi)mi.value=Number(data.monthlyGoal)||'';if(yi&&document.activeElement!==yi)yi.value=Number(data.yearlyGoal)||'';
 const months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
 const rows=months.map((label,i)=>{const key=selectedYear+'-'+String(i+1).padStart(2,'0');const rev=paidIncomeFor(data.bookings.filter(x=>String(x.date||'').slice(0,7)===key));const exp=data.expenses.filter(x=>String(x.date||'').slice(0,7)===key).reduce((t,x)=>t+Number(x.amount||0),0);return {label,rev,exp,month:i+1}});
 const max=Math.max(1,...rows.flatMap(x=>[x.rev,x.exp]));document.getElementById('annualBars').innerHTML=rows.map(r=>`<button class="month-column ${selectedMonth===r.month?'selected':''}" onclick="pickChartMonth(${r.month})" title="${r.label} · รายรับ ${money(r.rev)} บาท · รายจ่าย ${money(r.exp)} บาท"><span class="column-values"><i>${shortMoney(r.rev)}</i><i>${shortMoney(r.exp)}</i></span><span class="column-plot"><span class="column-bar income" style="height:${Math.max(r.rev?3:0,r.rev/max*100)}%"></span><span class="column-bar expense" style="height:${Math.max(r.exp?3:0,r.exp/max*100)}%"></span></span><span class="column-label">${r.label}</span></button>`).join('');
}
function shortMoney(n){n=Number(n)||0;return n>=1000000?(n/1000000).toFixed(1)+'ล.':n>=1000?(n/1000).toFixed(1)+'k':Math.round(n).toLocaleString('th-TH')}
function pickChartMonth(m){selectedMonth=m;renderPeriodViews();window.scrollTo({top:0,behavior:'smooth'})}
function saveGoals(){const m=Math.max(0,Number(document.getElementById('monthlyGoalInput').value)||0),y=Math.max(0,Number(document.getElementById('yearlyGoalInput').value)||0);data.monthlyGoal=m;data.yearlyGoal=y;save();alert('บันทึกเป้าหมายเรียบร้อยแล้ว')}
function applyTheme(){const dark=localStorage.getItem('spa.manager.theme')==='dark';document.body.classList.toggle('dark',dark);document.getElementById('themeIcon').textContent=dark?'☾':'☀';document.getElementById('themeText').textContent=dark?'โหมดกลางคืน':'โหมดปกติ';document.getElementById('themeToggle').setAttribute('aria-label',dark?'เปลี่ยนเป็นโหมดปกติ':'เปลี่ยนเป็นโหมดกลางคืน');}
function toggleTheme(){const next=document.body.classList.contains('dark')?'light':'dark';localStorage.setItem('spa.manager.theme',next);applyTheme()}
function syncPeriodControls(){
 const ids=['booking','expense'];
 ids.forEach(prefix=>{const label=document.getElementById(prefix+'PeriodLabel');if(label)label.textContent=periodName();const summary=document.getElementById(prefix+'PeriodSummary');if(summary)summary.textContent=selectedMonth===0?'ข้อมูลตลอดทั้งปีที่เลือก':'ข้อมูลเฉพาะเดือนที่เลือก';const m=document.getElementById(prefix+'MonthMode'),y=document.getElementById(prefix+'YearMode');if(m)m.classList.toggle('active',selectedMonth!==0);if(y)y.classList.toggle('active',selectedMonth===0)});
}
function renderBookingCalendar(){
 const month=selectedMonth===0?new Date().getMonth()+1:selectedMonth;
 const year=selectedYear;
 const first=new Date(year,month-1,1).getDay();
 const days=new Date(year,month,0).getDate();
 const counts={};
 data.bookings.filter(x=>String(x.date||'').slice(0,7)===year+'-'+String(month).padStart(2,'0')&&x.status!=='ยกเลิก').forEach(x=>{const d=Number(String(x.date).slice(8,10));counts[d]=(counts[d]||0)+1});
 document.getElementById('bookingCalendarTitle').textContent=new Date(year,month-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'});
 const cells=[];for(let i=0;i<first;i++)cells.push('<span class="calendar-day blank"></span>');
 for(let d=1;d<=days;d++){const has=!!counts[d],todayFlag=(year===new Date().getFullYear()&&month===new Date().getMonth()+1&&d===new Date().getDate()),iso=year+'-'+String(month).padStart(2,'0')+'-'+String(d).padStart(2,'0');cells.push(`<button type="button" class="calendar-day ${has?'has-booking':''} ${todayFlag?'is-today':''} ${selectedBookingDate===iso?'selected':''}" onclick="selectBookingDay('${iso}')" title="${has?counts[d]+' คิว':'ไม่มีคิว'}"><b>${d}</b>${has?'<i></i>':''}</button>`)}
 document.getElementById('bookingCalendar').innerHTML=cells.join('');
}
function selectBookingDay(iso){selectedBookingDate=iso;const y=Number(iso.slice(0,4)),m=Number(iso.slice(5,7));selectedYear=y;selectedMonth=m;renderPeriodViews();}
function toMinutes(t){if(!t||!/^\d{2}:\d{2}$/.test(t))return 0;const [h,m]=t.split(':').map(Number);return h*60+m}
function fromMinutes(n){return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function addMinutes(t,n){return fromMinutes(toMinutes(t)+Number(n||0))}
function overlap(a,b,c,d){return a<d&&c<b}
function legacyDuration(x){const svc=data.services.find(s=>s.name===x.service);return Number(svc?.duration)||60}
function renderDaySchedule(){
 const date=selectedBookingDate||today(),rows=data.bookings.filter(x=>x.date===date&&x.status!=='ยกเลิก').sort((a,b)=>toMinutes(a.time)-toMinutes(b.time));
 const label=fmtDate(date);document.getElementById('selectedDayTitle').textContent='ตารางคิววันที่ '+label;document.getElementById('dayBookingCount').textContent=rows.length+' คิว';
 const slots=[];for(let t=540;t<1200;t+=60){const end=Math.min(t+60,1200),hit=rows.find(x=>overlap(t,end,toMinutes(x.time||'09:00'),toMinutes(x.endTime||addMinutes(x.time||'09:00',legacyDuration(x)))));slots.push(`<div class="schedule-slot ${hit?'busy':'free'}"><strong>${fromMinutes(t)}–${fromMinutes(end)}</strong><small>${hit?'มีคิว: '+esc(hit.customer)+' · '+esc(hit.service):'ว่าง'}</small></div>`)}
 const bookings=rows.length?`<div class="schedule-bookings">${rows.map(x=>`<div class="schedule-booking"><div><b>${esc(x.time||'--:--')}–${esc(x.endTime||addMinutes(x.time||'09:00',legacyDuration(x)))}</b><br>${esc(x.customer)} · ${esc(x.service)}<br><small>${esc(x.staff||'ยังไม่ระบุพนักงาน')}</small></div><strong>${money(x.amount)}</strong></div>`).join('')}</div>`:'<div class="empty" style="margin-top:12px">วันนี้ยังไม่มีการจอง สามารถรับคิวได้ตลอดเวลาทำการ</div>';
 document.getElementById('daySchedule').innerHTML=`<div class="schedule-legend"><span><i style="background:#d9f1e4"></i>ว่าง</span><span><i style="background:#f8dede"></i>มีการจอง</span></div><div class="schedule-grid">${slots.join('')}</div>${bookings}`;
}
function renderBookings(){
 renderBookingCalendar();renderDaySchedule();
 const rows=[...data.bookings].filter(x=>isInPeriod(x.date)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const valid=rows.filter(x=>x.status!=='ยกเลิก');
 const income=valid.filter(x=>x.paid===true).reduce((s,x)=>s+Number(x.amount||0),0);
 document.getElementById('bookingCount').textContent=rows.length+' รายการ';
 document.getElementById('bookingIncomeTotal').textContent=money(income);
 document.getElementById('bookingDoneCount').textContent=rows.filter(x=>x.paid===true).length+' จ่ายแล้ว';
 document.getElementById('bookingCancelledCount').textContent=rows.filter(x=>x.status==='ยกเลิก').length+' คิว';
 document.getElementById('bookingPeriodTag').textContent=periodName();
 document.getElementById('bookingList').innerHTML=rows.length?rows.map(x=>`<div class="booking-row"><div class="booking-time">${esc(x.time||'--:--')}–${esc(x.endTime||addMinutes(x.time||'09:00',legacyDuration(x)))}<small>${fmtDate(x.date)}</small></div><div><div class="booking-title">${esc(x.customer)} <span class="pill ${x.status==='ยกเลิก'?'red':x.status==='เสร็จสิ้น'?'':'gold'}">${esc(x.status)}</span> <span class="pill ${x.paid===true?'':'pending'}">${x.paid===true?'ชำระแล้ว':'ค้างชำระ'}</span></div><div class="booking-sub">${esc(x.service)} · ${esc(x.staff||'ยังไม่ระบุพนักงาน')}${x.phone?' · '+esc(x.phone):''}</div>${x.note?`<div class="booking-sub">${esc(x.note)}</div>`:''}</div><div class="booking-side"><strong>${money(x.amount)}</strong>${x.status!=='ยกเลิก'&&x.paid!==true?`<button class="btn paid-action" onclick="markBookingPaid(${x.id})">จ่ายครบแล้ว</button>`:''}<button class="btn ghost" onclick="deleteBooking(${x.id})">ลบ</button></div></div>`).join(''):'<div class="empty">ยังไม่มีรายการจองในช่วงเวลาที่เลือก</div>';
 syncPeriodControls();
}
function clearBookingFilter(){renderBookings()}
function renderExpenses(){
 const rows=[...data.expenses].filter(x=>isInPeriod(x.date)).sort((a,b)=>b.date.localeCompare(a.date));
 const total=rows.reduce((s,x)=>s+Number(x.amount||0),0);
 const owner=rows.filter(x=>x.category==='เจ้าของเบิก').reduce((s,x)=>s+Number(x.amount||0),0);
 document.getElementById('expenseTotal').textContent=money(total);
 document.getElementById('expenseOperating').textContent=money(total-owner);
 document.getElementById('expenseOwner').textContent=money(owner);
 document.getElementById('expenseCount').textContent=rows.length+' รายการ';
 document.getElementById('expensePeriodTag').textContent=periodName();
 document.getElementById('expenseRows').innerHTML=rows.length?rows.map(x=>`<tr><td>${fmtDate(x.date)}</td><td><span class="expense-name"><span class="expense-icon">${expenseIcon(x.category)}</span>${esc(x.category==='ค่าไฟ'?'ค่าไฟฟ้า':x.category)}</span></td><td>${esc(x.detail||'-')}${x.commission?`<small>ฐาน ${money(x.baseAmount??(Number(x.amount)/(1+Number(x.commission)/100)))} · คอมมิชชัน ${x.commission}% (${money(x.commissionAmount??(Number(x.amount)-Number(x.baseAmount??(Number(x.amount)/(1+Number(x.commission)/100)))) )})</small>`:''}</td><td class="amount negative">${money(x.amount)}</td><td><button class="btn ghost" onclick="deleteExpense(${x.id})">ลบ</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">ยังไม่มีรายการรายจ่ายในช่วงเวลาที่เลือก</td></tr>';
 syncPeriodControls();
}
function renderServices(){document.getElementById('serviceGrid').innerHTML=data.services.length?data.services.map(x=>`<div class="card service-card"><h3>${esc(x.name)}</h3><p>ระยะเวลา ${Number(x.duration)||0} นาที</p><div class="service-price">${money(x.price)}</div><div style="margin-top:14px"><button class="btn ghost" onclick="deleteService(${x.id})">ลบบริการ</button></div></div>`).join(''):'<div class="card empty">ยังไม่มีบริการ</div>'}
function renderSettings(){document.getElementById('dataSummary').innerHTML=`รายการจอง: ${data.bookings.length}<br>รายการรายจ่าย: ${data.expenses.length}<br>รายการบริการ: ${data.services.length}`;const input=document.getElementById('openingBalanceInput');if(input&&document.activeElement!==input)input.value=Number(data.openingBalance||0)}
function saveOpeningBalance(){const v=Number(document.getElementById('openingBalanceInput').value);if(!Number.isFinite(v)||v<0){alert('กรุณากรอกยอดเงินตั้งต้นให้ถูกต้อง');return}data.openingBalance=v;save();alert('บันทึกยอดเงินตั้งต้นแล้ว')}
function populateSelects(){document.getElementById('expenseCategory').innerHTML=expenseCategories.map(x=>`<option>${x}</option>`).join('');document.getElementById('bookingService').innerHTML='<option value="">เลือกบริการ</option>'+data.services.map(x=>`<option value="${esc(x.name)}" data-price="${x.price}">${esc(x.name)} — ${money(x.price)}</option>`).join('')}
function openBooking(){const f=document.getElementById('bookingForm');f.reset();f.date.value=selectedBookingDate||today();f.time.value='10:00';f.endTime.value='11:00';document.getElementById('bookingDurationHint').textContent='ร้านเปิด 09:00–20:00 น. เลือกเวลาเริ่มและสิ้นสุดได้';document.getElementById('bookingModal').classList.add('show')}
function openExpense(){const f=document.getElementById('expenseForm');f.reset();f.date.value=today();toggleCommission();document.getElementById('expenseModal').classList.add('show')}
function openService(){document.getElementById('serviceForm').reset();document.getElementById('serviceModal').classList.add('show')}
function closeModal(id){document.getElementById(id).classList.remove('show')}
function toggleCommission(){const c=document.getElementById('expenseCategory').value;const show=['เงินเดือนพนักงาน','ค่าพนักงานพาร์ตไทม์'].includes(c);document.getElementById('commissionField').classList.toggle('hidden',!show);document.getElementById('commissionPreview').classList.toggle('hidden',!show);const sel=document.querySelector('#expenseForm [name=commission]');if(c==='ค่าพนักงานพาร์ตไทม์'&&sel.value==='0')sel.value='30';if(c==='เงินเดือนพนักงาน'&&sel.value==='30')sel.value='10';updateCommissionPreview()}
function updateCommissionPreview(){const f=document.getElementById('expenseForm');const base=Number(f.amount.value)||0,pct=Number(f.commission.value)||0,extra=base*pct/100;document.getElementById('commissionBase').textContent=money(base);document.getElementById('commissionExtra').textContent=money(extra);document.getElementById('commissionTotal').textContent=money(base+extra)}
function expenseIcon(c){return ({'ค่าเช่า':'🏠','ค่าน้ำ':'💧','ค่าไฟฟ้า':'⚡','ค่าไฟ':'⚡','เงินเดือนพนักงาน':'👩‍💼','ค่าน้ำยา / ครีม':'🧴','ค่าอุปกรณ์':'💨','ค่าขนมลูกค้า':'🍪','ค่าอาหารพนักงาน':'🍱','ค่าพนักงานพาร์ตไทม์':'🧑‍🔧','ค่าอินเทอร์เน็ต':'📶','ค่าโฆษณา':'📣','ค่าแม่บ้านทำความสะอาด':'🧹','ค่าน้ำยาซักผ้า':'🫧','เจ้าของเบิก':'👛','ค่าโทรศัพท์':'📱','อื่น ๆ':'🧾'})[c]||'🧾'}
function markBookingPaid(id){const b=data.bookings.find(x=>x.id===id);if(!b||b.status==='ยกเลิก'||b.paid===true)return;if(confirm('ยืนยันว่าลูกค้าชำระเงินครบ '+money(b.amount)+' แล้วใช่หรือไม่?')){b.paid=true;b.paidAt=today();save()}}
document.querySelector('#expenseForm [name=amount]').addEventListener('input',updateCommissionPreview);

document.getElementById('bookingForm').date.addEventListener('change',e=>{selectedBookingDate=e.target.value});
document.getElementById('bookingStartTime').addEventListener('change',e=>{const end=document.getElementById('bookingEndTime');if(toMinutes(end.value)<=toMinutes(e.target.value))end.value=addMinutes(e.target.value,60);end.min=addMinutes(e.target.value,15)});
document.getElementById('bookingEndTime').addEventListener('change',e=>{if(toMinutes(e.target.value)>1200)e.target.value='20:00'});
document.getElementById('bookingService').addEventListener('change',e=>{const opt=e.target.selectedOptions[0];if(opt&&opt.dataset.price)document.querySelector('#bookingForm [name=amount]').value=opt.dataset.price;if(opt&&opt.value){const svc=data.services.find(x=>x.name===opt.value);if(svc&&svc.duration){const start=document.getElementById('bookingStartTime').value||'10:00';document.getElementById('bookingEndTime').value=addMinutes(start,Number(svc.duration));document.getElementById('bookingDurationHint').textContent='ระยะเวลาบริการ '+svc.duration+' นาที · สามารถปรับเวลาสิ้นสุดได้';}}});
document.getElementById('bookingForm').addEventListener('submit',e=>{e.preventDefault();const f=e.target;const v=Object.fromEntries(new FormData(f));const start=toMinutes(v.time),end=toMinutes(v.endTime);if(start<540||end>1200||end<=start){alert('เวลาจองต้องอยู่ระหว่าง 09:00–20:00 และเวลาสิ้นสุดต้องหลังเวลาเริ่ม');return}const conflict=data.bookings.find(x=>x.date===v.date&&x.status!=='ยกเลิก'&&overlap(start,end,toMinutes(x.time||'09:00'),toMinutes(x.endTime||addMinutes(x.time||'09:00',legacyDuration(x)))));if(conflict){alert('ช่วงเวลานี้มีการจองแล้ว ('+(conflict.time||'')+'–'+(conflict.endTime||addMinutes(conflict.time||'09:00',legacyDuration(conflict)))+') กรุณาเลือกเวลาอื่น');return}data.bookings.push({id:Date.now(),...v,amount:Number(v.amount),status:v.status||'จองแล้ว',paid:false});selectedBookingDate=v.date;save();closeModal('bookingModal');f.reset()});
document.getElementById('expenseForm').addEventListener('submit',e=>{e.preventDefault();const f=e.target;const v=Object.fromEntries(new FormData(f));const pct=['เงินเดือนพนักงาน','ค่าพนักงานพาร์ตไทม์'].includes(v.category)?Number(v.commission):0;const base=Number(v.amount),extra=base*pct/100;data.expenses.push({id:Date.now(),...v,baseAmount:base,commission:pct,commissionAmount:extra,amount:base+extra});save();closeModal('expenseModal');f.reset();toggleCommission()});
document.getElementById('serviceForm').addEventListener('submit',e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));data.services.push({id:Date.now(),name:v.name,price:Number(v.price),duration:Number(v.duration)});save();closeModal('serviceModal')});
function deleteBooking(id){if(confirm('ลบรายการจองนี้หรือไม่?')){data.bookings=data.bookings.filter(x=>x.id!==id);save()}}
function deleteExpense(id){if(confirm('ลบรายการรายจ่ายนี้หรือไม่?')){data.expenses=data.expenses.filter(x=>x.id!==id);save()}}
function deleteService(id){if(confirm('ลบบริการนี้หรือไม่?')){data.services=data.services.filter(x=>x.id!==id);save()}}
function backupData(){download('spa-manager-backup.json',JSON.stringify(data,null,2),'application/json')}
function restoreData(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.bookings)||!Array.isArray(d.expenses)||!Array.isArray(d.services))throw Error();if(confirm('นำเข้าข้อมูลและแทนที่ข้อมูลปัจจุบันหรือไม่?')){data={bookings:d.bookings,expenses:d.expenses,services:d.services,openingBalance:Number(d.openingBalance)||0,monthlyGoal:Number(d.monthlyGoal)||0,yearlyGoal:Number(d.yearlyGoal)||0};save();alert('นำเข้าข้อมูลเรียบร้อย')}}catch{alert('ไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์สำรองของ Spa Manager')}e.target.value=''};r.readAsText(file)}
function exportExpenses(){const rows=[['วันที่','หมวดหมู่','รายละเอียด','จำนวนเงิน','ค่าคอมมิชชัน (%)'],...data.expenses.map(x=>[x.date,x.category,x.detail||'',x.amount,x.commission||0])];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');download('spa-expenses.csv',csv,'text/csv;charset=utf-8')}
function download(name,content,type){const a=document.createElement('a');const u=URL.createObjectURL(new Blob([content],{type}));a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
function clearAllData(){if(confirm('ยืนยันลบข้อมูลทั้งหมด? แนะนำให้ดาวน์โหลด Backup ก่อน')){data={bookings:[],expenses:[],services:defaultServices,openingBalance:0,monthlyGoal:0,yearlyGoal:0};save()}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
document.getElementById('todayLabel').textContent=new Date().toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
applyTheme();
renderAll();
if('serviceWorker' in navigator && location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
