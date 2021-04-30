const rp = require('request-promise');
const $ = require('cheerio');
const urlCotizaciones = "https://banco.santanderrio.com.ar/exec/cotizacion/index.jsp";

module.exports = {
  cotizarMoneda : async (entities) =>{
    let cotizacion = await consultarCotizacion();
    if("moneda" in entities){
        let moneda = entities.moneda[0].value;
        if(!moneda in cotizacion){return 1;}
        else if(cotizacion.dolar[0]==='$ null'){return 2;}
        else if("tipoCambio" in entities && entities.tipoCambio[0].value === "comprador"){
            let tipoCambio = entities.tipoCambio[0].value
            return [moneda, tipoCambio, cotizacion[moneda][0]]
            //return `El precio del ${moneda} ${tipoCambio} es: ${cotizacion[moneda][0]}`;
        }else if("tipoCambio" in entities && entities.tipoCambio[0].value === "vendedor"){
            let tipoCambio = entities.tipoCambio[0].value
            return [moneda, tipoCambio, cotizacion[moneda][1]]
            //return `El precio del ${moneda} ${tipoCambio} es: ${cotizacion[moneda][1]}`;
        }else{
            return [moneda, "comprador", cotizacion[moneda][0], cotizacion[moneda][1]]
            //return `El precio del ${moneda} comprador es:${cotizacion[moneda][0]} y vendedor: ${cotizacion[moneda][1]}`;
        }
    }
    else{return 0;}
    }
}


const consultarCotizacion = async () => {
    const html = await rp(urlCotizaciones);
    let scrap = $('tr > td', html);
    let cotizacion = {
      dolar : [],
      euro : [],
    };
    for(let i = 0; i < scrap.length; i++){
      var text = scrap[i].children[0].data;
      if(i>0 && i<3){
        cotizacion.dolar.push(text);
      }
      if(i>3 && i<6){
        cotizacion.euro.push(text);
      }
    }
    return cotizacion;
}
