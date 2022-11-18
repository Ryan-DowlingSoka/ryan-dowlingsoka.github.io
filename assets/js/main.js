$(document).ready(function() {
  on_ready();
  
});

function resizeInstance(instance){
  item = instance.elements[0];
  resizeGridItem(item);
}

function resizeGridItem(item){
  grid = item.closest(".entries-grid");
  if( grid == null) return;
  grid.style.gridAutoRows = "10px";
  grid.style.opacity = 1;
  rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
  rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));
  content = item;
  if( content==null) return;
  height = item.getBoundingClientRect().height;
  console.log(height);
  rowSpan = Math.ceil((height+rowGap)/(rowHeight+rowGap));
  item.style.gridRowEnd = "span "+rowSpan;
}

function resizeAllGridItems(){
  allItems = document.getElementsByClassName("entry");
  for(x=0;x<allItems.length;x++){
     resizeGridItem(allItems[x]);
  }
}

function on_ready(){
  // main menu toggle
  var toggleButton = document.getElementById("menu-toggle");
  var menu = document.getElementById("primary-nav");

  if (toggleButton && menu) {
    toggleButton.addEventListener("click", function() {
      menu.classList.toggle("js-menu-is-open");
    });
  }

  // initialize smooth scroll
  $("a").smoothScroll({ offset: -20 });

  // add lightbox class to all image links
  $("a[href$='.jpg'], a[href$='.png'], a[href$='.gif']").attr("data-lity", "");

  var coll = document.getElementsByClassName("collapsible");
  var i;

  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      content.classList.toggle("active");
    });
  }

  window.addEventListener("resize", resizeAllGridItems);

  allItems = document.getElementsByClassName("item");
  for(x=0;x<allItems.length;x++){
    imagesLoaded( allItems[x], resizeInstance);
  }

  resizeAllGridItems();
}



