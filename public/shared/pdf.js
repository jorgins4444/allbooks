(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('../vendor/pdf-lib.min.js'));
  else root.EbookPDF=factory(root.PDFLib);
})(typeof window!=='undefined'?window:this,function(PDFLib){
  async function create(book,{reviewed=false}={}) {
    const {PDFDocument,StandardFonts,rgb}=PDFLib;
    const doc=await PDFDocument.create();
    const font=await doc.embedFont(StandardFonts.Helvetica);
    const bold=await doc.embedFont(StandardFonts.HelveticaBold);
    const navy=rgb(.07,.16,.26),teal=rgb(0,.43,.49),gray=rgb(.35,.4,.46);
    const width=595.28,height=841.89,margin=54;
    let page,y;
    const safe=s=>Array.from(String(s||'').replace(/\r/g,'')).map(ch=>{if(ch==='\n')return ch;try{font.encodeText(ch);return ch;}catch{return '';}}).join('');
    function newPage(){page=doc.addPage([width,height]);y=height-margin;page.drawRectangle({x:0,y:height-8,width,height:8,color:teal});}
    function line(t,size=11,f=font,color=navy){if(y<65)newPage();page.drawText(safe(t),{x:margin,y,size,font:f,color});y-=size*1.55;}
    function wrapped(t,size=11,f=font,color=navy){
      for(const paragraph of safe(t).split('\n')){
        if(!paragraph.trim()){y-=8;continue;}
        let current='';
        for(const token of paragraph.split(/\s+/)){
          const candidate=current?current+' '+token:token;
          if(f.widthOfTextAtSize(candidate,size)<=width-margin*2){current=candidate;continue;}
          if(current){line(current,size,f,color);current='';}
          let fragment='';
          for(const ch of token){if(f.widthOfTextAtSize(fragment+ch,size)>width-margin*2){line(fragment,size,f,color);fragment='';}fragment+=ch;}
          current=fragment;
        }
        if(current)line(current,size,f,color);
        y-=5;
      }
    }
    newPage();y-=75;wrapped(book.niche.toUpperCase(),11,bold,teal);y-=30;
    wrapped(book.title,30,bold);y-=15;wrapped(book.subtitle,15,font,gray);y-=45;
    wrapped(book.author,13,bold);wrapped(reviewed?'Edição revisada para distribuição gratuita':'Rascunho editorial - revisão pendente',10,font,gray);
    y-=20;wrapped(book.summary,11);y-=15;
    wrapped(book.assisted?'Elaboração assistida por IA. A assinatura editorial e a responsabilidade pela revisão cabem ao autor.':'Material original. Revisão e responsabilidade editorial do autor.',9,font,gray);
    newPage();wrapped('Neste ebook',24,bold);y-=15;
    if(book.audience)wrapped('Para quem: '+book.audience,11);
    if(book.goal)wrapped('Objetivo: '+book.goal,11);
    y-=10;for(const chapter of book.chapters)wrapped(chapter.title,12,bold);
    for(const chapter of book.chapters){newPage();wrapped(chapter.title,23,bold);y-=18;wrapped(chapter.body||'[Conteúdo a desenvolver]',11);}
    if(book.sources){newPage();wrapped('Referências e notas editoriais',23,bold);y-=15;wrapped(book.sources,10);}
    const pages=doc.getPages();
    pages.forEach((pg,i)=>{
      pg.drawLine({start:{x:margin,y:42},end:{x:width-margin,y:42},thickness:.4,color:rgb(.8,.84,.87)});
      pg.drawText(safe(reviewed?'DISTRIBUIÇÃO GRATUITA':'RASCUNHO PARA REVISÃO'),{x:margin,y:27,size:8,font,color:gray});
      pg.drawText(`${i+1} / ${pages.length}`,{x:width-margin-35,y:27,size:8,font,color:gray});
    });
    doc.setTitle(book.title);doc.setAuthor(book.author);doc.setSubject(book.summary);doc.setCreator('Estúdio de ebooks');
    return doc.save();
  }
  return {create};
});
