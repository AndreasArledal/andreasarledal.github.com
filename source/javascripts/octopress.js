window.addEvent('domready', function() {
  codeblocks = $$('div.highlight');
  codeblocks.each(addExpander);
});

function addExpander(div){
  new Element('span',{
		html: 'expand &raquo;',
		'class': 'pre_expander',
    'events': {
      'click': function(){
        toggleExpander();
      }
    }
	}).inject(div, 'top');
}
function toggleExpander(){
  var html = '';
  if($('main').toggleClass('expanded').hasClass('expanded'))
    html = '&laquo; contract';
  else
    html = 'expand &raquo;';
  $$('div.highlight span.pre_expander').each(function(span){
      span.set('html',html);
  });
}
function enableCompressedLayout(codeblocks){
  if(!codeblocks.length) return;
  new Element('span',{
		html: 'Collapse layout',
		'id': 'collapser',
    'events': {
      'click': function(){
        if($('page').toggleClass('collapsed').hasClass('collapsed'))
          this.set('html','Expand layout');
        else
          this.set('html','Collapse layout');
      }
    }
	}).inject($('main'), 'top');
}