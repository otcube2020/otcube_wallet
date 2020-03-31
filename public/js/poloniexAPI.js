function poloniex(){
    $.get('https://poloniex.com/public?command=returnTicker', function(data) {
        var poloniex_btc = parseFloat(data['USDT_BTC']['last']);
        var poloniex_eth = parseFloat(data['USDT_ETH']['last']);     
        
        $('#usdtBitcoin').empty();
        $('#usdtBitcoin').append('<em>'+ numberWithCommas(Math.round(poloniex_btc))+'</em>$');
        

        $('#usdtEthereum').empty();
        $('#usdtEthereum').append('<em>'+ numberWithCommas(Math.round(poloniex_eth))+'</em>$');
    });
}

 // 천단위 콤마 함수
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}