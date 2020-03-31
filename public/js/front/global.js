$(document).ready(function(){

  // container height
  var window_h = $(window).height();
  var essential_h = $('header').height() + $('footer').height() + $('.container > .subject').height();
  $('.container .contents').css({'min-height':window_h - essential_h});
  $('.sub_container .col').css({'min-height':window_h});
  $(window).resize(function(){
  	var window_h = $(window).height();
  	var essential_h = $('header').height() + $('footer').height() + $('.container > .subject').height();
  	$('.container .contents').css({'min-height':window_h - essential_h});
  	$('.sub_container .col').css({'min-height':window_h});
  });

  // animation
  $('section.sec01').addClass('vertAni-on');
  $('.subject').addClass('vertAni-on');

  // popup
  // $('a.btnPopNum1').click(function(){
  // 	$('.popNum1').show();
  // })
  $('.popNum1 a.btn_popClose').click(function(){
  	$('.popNum1').fadeOut();
  })

  $('a.btnPopNum2').click(function(){
  	$('.popNum2').show();
  })
  $('.popNum2 a.btn_popClose').click(function(){
  	$('.popNum2').fadeOut();
  })

  $('.popNum3 a.btn_popClose').click(function(){
  	$('.popNum3').fadeOut();
  })

  //추가 2019.01.05
  $('.popNum_send a.btn_popClose').click(function(){
      $('.popNum_send').fadeOut();
  })

  $('.popNum_sendComplete a.btn_popClose').click(function(){
    $('.popNum_sendComplete').fadeOut();
})

  $('a.btnPopReceive').click(function(){
  	$('.popReceive').show();
  })
  $('.popReceive a.btn_popClose').click(function(){
  	$('.popReceive').fadeOut();
  })

  $('a.btnPopSend').click(function(){
  	$('.popSend').show();
  })
  $('.popSend a.btn_popClose').click(function(){
  	$('.popSend').fadeOut();
  })

  $('a.mobile_menu').click(function(){
  	$('.popMenu').show();
  })
  $('.popMenu a.btn_popClose').click(function(){
  	$('.popMenu').fadeOut();
  })

  // mo popup tab color
  $('.page_popup ul.tabMenu li.wallet').click(function(){
  	$('.page_popup .tabCn').removeClass().addClass('tabCn wallet');
  })
  $('.page_popup ul.tabMenu li.eth').click(function(){
  	$('.page_popup .tabCn').removeClass().addClass('tabCn eth');
  })
  $('.page_popup ul.tabMenu li.gbt').click(function(){
  	$('.page_popup .tabCn').removeClass().addClass('tabCn gbt');
  })
  $('.page_popup ul.tabMenu li.buy').click(function(){
  	$('.page_popup .tabCn').removeClass().addClass('tabCn buy');
  })

  // menu drop
  $('ul.menu li').mouseenter(function(){
  	$('ul.sub_menu',this).show();
  }).mouseleave(function(){
  	$('ul.sub_menu',this).hide();
  })

});
