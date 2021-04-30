require('isomorphic-fetch');
const {Wit} = require('node-wit');
const format = require('util').format;
const witToken = process.env.WIT_AI_TOKEN;

const authHelper = require('./authHelper.js');
const CalendarioHelper = require('./calendarioHelper.js');
const cotizacionHelper = require('./cotizacionHelper.js');
const respuestasSeteadas = require("../assets/respuestas.json")[process.env.LANGUAGE];
const log = require('simple-node-logger').createSimpleFileLogger('log/bot.log');

const clientWit = new Wit({
    accessToken: witToken
});

class  Bot{
   constructor(from, to, sendMessage){
        this.from = from;
        this.to = to;
        this.estadoReserva = 0
        this.token;
        this.ultimoMensaje = "";
        this.calendarioHelper;
        this.sendMessage = sendMessage;
    }

    async receivedMessage(message){
        this.ultimoMensaje = message;
        try{
            let entities = await this.recognizeMessage(message);
            await this.decisionAction(entities);
            return 200;
        }catch(err){
            log.error(`Mensaje Recibido: ${this.ultimoMensaje}`);
            console.log(err.body);
            log.error(err.body);
            return 500;
        }
    }
    
    async recognizeMessage(message){
        try{
            let response = await clientWit.message(message);
            return response.entities;
        }catch(err){
            throw({
                body:err
            })
        }
    }

    async decisionAction(entities){
        let respuesta = "";
        if("intent" in entities && entities.intent[0].value === "saludo"){
            respuesta = respuestasSeteadas.buenDia;
        }else if("intent" in entities && entities.intent[0].value === "despedida"){
            respuesta = respuestasSeteadas.despedida;
        }else if("intent" in entities && entities.intent[0].value === "cotizacion"){
            let valor = await cotizacionHelper.cotizarMoneda(entities)
            if(valor===0){respuesta = respuestasSeteadas.consultaMoneda;}
            else if(valor===1){respuesta = respuestasSeteadas.faltaMoneda;}
            else if(valor===2){respuesta = respuestasSeteadas.cotizacionCaida;}   
            else if(valor.length<4){respuesta = format(respuestasSeteadas.cotizacion, valor[0], valor[1], valor[2]);}
            else{respuesta = format(respuestasSeteadas.cotizacion, valor[0], valor[1], valor[2])+format(respuestasSeteadas.vendedor, valor[3])}
        }else if("intent" in entities && entities.intent[0].value === "reservar"){
            if(typeof this.token === 'undefined'){
                authHelper.botHelped = this;
                respuesta = format(respuestasSeteadas.solicitudRegistro, authHelper.getAuthUrl())
            }else if(this.token.expired()){
                authHelper.botHelped = this;
                respuesta = format(respuestasSeteadas.tokenExpirado, authHelper.getAuthUrl())
            }else{
                this.calendarioHelper = new CalendarioHelper(this.token);
                respuesta = await this.reservaDeSalas(entities);
            }
        }else if("intent" in entities && entities.intent[0].value === "cancelarReserva"){
            if(typeof this.token === 'undefined'){
                authHelper.botHelped = this;
                respuesta = format(respuestasSeteadas.solicitudRegistro, authHelper.getAuthUrl())
            }else if(this.token.expired()){
                authHelper.botHelped = this;
                respuesta = format(respuestasSeteadas.tokenExpirado, authHelper.getAuthUrl())
            }else{
                this.calendarioHelper = new CalendarioHelper(this.token);
                respuesta = await this.cancelarEvento();
                this.estadoReserva = 3;
            }
        }else if("intent" in entities && entities.intent[0].value === "obtenerEventos"){
            if(typeof this.token === 'undefined'){
                authHelper.botHelped = this;
                respuesta = format(respuestasSeteadas.solicitudRegistro, authHelper.getAuthUrl())
            }else if(this.token.expired()){
                authHelper.botHelped = this;
                respuesta = format(respuestasSeteadas.tokenExpirado, authHelper.getAuthUrl())
            }else{
                this.calendarioHelper = new CalendarioHelper(this.token);
                respuesta = await this.obtenerEventos();
            }
        }else if(("datetime" in  entities || "duration" in entities) && (this.estadoReserva === 1  || this.estadoReserva === 2)){
            respuesta = await this.reservaDeSalas(entities);
        }else if("number" in entities && this.estadoReserva === 2){
            respuesta = await this.confirmarReservaSala(entities);
        }else if("number" in entities && this.estadoReserva === 3){
            respuesta = await this.calendarioHelper.confirmarCancelacion(entities);
            if(respuesta){
                respuesta = respuestasSeteadas.confirmacionCancelacion;
            }else{
                respuesta = respuestasSeteadas.rechazoCancelacion;
            }
            this.estadoReserva = 0;
        }else{
            respuesta = respuestasSeteadas.rechazoConsulta;
        }
        this.sendMessage(respuesta, this.from, this.to);
    }

    async obtenerEventos(){
        let eventos = await this.calendarioHelper.obtenerEventos();
        let respuesta = this.formatearEventos(eventos);
        return respuesta[1];

    }

    async cancelarEvento(){
        let eventos = await this.calendarioHelper.obtenerEventos();
        let respuesta = this.formatearEventos(eventos);
        if(respuesta[0] === 0){
            return respuesta[1];
        }
        respuesta = respuesta[1] + `${respuesta[0]+1}. ` + respuestasSeteadas.salirCancelacion;
        return respuesta;
    }

    formatearEventos(eventos){
        let respuesta = respuestasSeteadas.eventosSemana
        let i;
        if(eventos.length>0){
            for(i = 0; i < eventos.length; i++){
                let elemento = eventos[i];
                let inicioEvento = new Date(elemento.start.dateTime)
                let diaInicio = respuestasSeteadas.dias[inicioEvento.getDay()]
                let finEvento = new Date(elemento.end.dateTime)
                let diaFin = respuestasSeteadas.dias[finEvento.getDay()]
                respuesta = respuesta + `${i+1}. ` + format(respuestasSeteadas.evento, 
                    diaInicio, inicioEvento.getDate(), inicioEvento.toLocaleString('es-AR',{ timeZone: 'America/Argentina/Salta', hour: '2-digit', minute: '2-digit'}),
                    diaFin, finEvento.getDate(), finEvento.toLocaleString('es-AR',{ timeZone: 'America/Argentina/Salta', hour:'2-digit', minute:'2-digit'}),
                    elemento.subject);
            }
        }
        else{
            respuesta = respuestasSeteadas.noEventosDisponibles;
        }
        return [i,respuesta];
    }

    async reservaDeSalas(entities){
        let respuesta = await this.calendarioHelper.reservarSala(entities);
        if(respuesta[0] === 0){
            //Hay salas disponibles
            let respuestaAux = respuestasSeteadas.salasDisponibles;
            let salasPosibles = respuesta[1];
            let i = 0;
            for(i = 0; i < salasPosibles.length; i++){
              respuestaAux = `${respuestaAux} \n${i+1}. *${salasPosibles[i].name}*`;
            }
            respuesta = `${respuestaAux} \n${i+1}. ${respuestasSeteadas.salirReserva}`
            this.estadoReserva = 2;
        }else if(respuesta[0] === 1){
            //No hay salas disponibles
            this.estadoReserva = 1
            respuesta = respuestasSeteadas.noSalasDisponibles;
        }else if(respuesta[0] === 2){
            //Falta fecha de fin
            this.estadoReserva = 1;
            respuesta = respuestasSeteadas.consultarDuracion;
        }else if(respuesta[0] === 3){
            //Falta fecha de inicio y fin
            respuesta = respuestasSeteadas.consultarFecha;
            this.estadoReserva = 1;
        }
        return respuesta;
    }
    
    async confirmarReservaSala(entities){
        let respuesta = ""
        if(await this.calendarioHelper.confirmarReserva(entities)){
            respuesta = respuestasSeteadas.confirmacionSala;
        }else{
            respuesta = respuestasSeteadas.rechazoSala;
        }
        this.estadoReserva = 0;
        return respuesta;
    }

    async retomarDecisionAction(){
        //this.sendMessage(`Hola ${this.from}`, this.from, this.to);
        this.sendMessage(respuestasSeteadas.confirmacionRegistro, this.from, this.to);
        this.receivedMessage(this.ultimoMensaje);
    }
    

}

module.exports = Bot;
