// Fixed synthetic queues isolate grading/persistence from randomized corpus selection.
export async function startFixture(page) {
 await page.evaluate(()=>{
   state=normalizeState({activeDeck:'en-b1',preferredLang:'en',settings:{dailyGoal:3,aiEnabled:true},corpusMigrationDone:true});
   markLearningEntry(); save({sync:false}); renderAll();
   beginQueue(['en-clarify','en-update','en-feedback'].map(id=>({type:'deck',deckId:'en-b1',id})));
   go('study');
 });
}
export async function verifyFirstEntry(page,check) {
 check('浏览器旅程','新用户直接进入真实首题',await page.locator('#study').isVisible()&&await page.locator('#choiceOptions [data-choice]').count()===4,await page.locator('#studyDeck').innerText());
 const target=await page.evaluate(()=>card().c.target);
 await page.locator('#choiceOptions').getByRole('button',{name:target,exact:true}).click();
 await page.locator('#nextBtn').click();
 check('浏览器旅程','首题后才设置语言与每日目标',await page.locator('#firstLanguage').isVisible()&&await page.locator('#firstDailyGoal').isVisible(),'当前首题体验后的偏好表单');
 await page.locator('#firstLanguage').selectOption('en');await page.locator('#firstDailyGoal').selectOption('3');
 await page.locator('#firstPreferences button[type=submit]').click();
 check('浏览器旅程','保存偏好回到今天且刷新不重复首题',await page.locator('#today').isVisible(),'首题 → 偏好 → 今天');
 await page.reload({waitUntil:'networkidle'});
 check('浏览器旅程','刷新保留偏好且不重复首题',await page.locator('#today').isVisible()&&await page.evaluate(()=>state.settings.dailyGoal===3),'独立新用户上下文');
}

export async function isolatePage(page) {
 await page.addInitScript(()=>{
   window.__ciDroppedBeacons=0;
   Object.defineProperty(navigator,'sendBeacon',{configurable:true,value:()=>{window.__ciDroppedBeacons++;return true;}});
 });
 await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(['127.0.0.1','localhost','[::1]'].includes(url.hostname))return route.continue();
   return route.abort('blockedbyclient');
 });
}
