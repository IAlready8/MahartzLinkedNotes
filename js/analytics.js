/* analytics.js — usage, performance, patterns, effectiveness */
const Analytics = {
  enabled: true,
  startMark(name){ performance.mark('start-'+name); },
  endMark(name){
    try{
      performance.mark('end-'+name);
      performance.measure(name, 'start-'+name, 'end-'+name);
    }catch(e){}
  },
  async log(evt, data={}){
    if(!this.enabled) return;
    await Store.log({ id: ULID(), evt, data, t: Date.now() });
    UI.eventsPush({evt, data});
  },
  derive(notes){
    const total = notes.length;
    const linksPer = total? (notes.reduce((a,n)=>a+(n.links?.length||0),0)/total):0;
    const pct2 = total? (100*notes.filter(n=> (n.links?.length||0)>=2).length/total):0;
    // activity last 14 days
    const days = Array.from({length:14}, (_,i)=> {
      const d = new Date(); d.setDate(d.getDate()-(13-i));
      return d.toISOString().slice(0,10);
    });
    const daily = Object.fromEntries(days.map(d=>[d,0]));
    for(const n of notes){
      const d = (n.updatedAt||n.createdAt||'').slice(0,10);
      if(daily[d]!=null) daily[d]+=1;
    }
    return { total, linksPer:+linksPer.toFixed(2), pct2:+pct2.toFixed(0), daily };
  },
  perfDump(){
    const m = performance.getEntriesByType('measure').slice(-10);
    return m.map(x=>`${x.name}: ${x.duration.toFixed(1)}ms`).join('\n') || '—';
  }
};
