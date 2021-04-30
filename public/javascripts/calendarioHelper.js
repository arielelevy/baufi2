const graph = require('./graph')

class reservaHelper{
    constructor(token){
      this.token = token.token.access_token;
      this.email = token.email;
      this.desde;
      this.hasta;
      this.duracion;
      this.salasPosibles = [];
      this.eventosSemana = [];
    }

    async reservarSala(entities){
      let respuesta = [3]
        if("datetime" in entities){
          let datetime = entities.datetime[0]
          if("from" in datetime && "to" in datetime){
            this.desde = new Date(datetime.from.value);
            this.hasta = new Date(datetime.to.value);
            await this.obtenerSalasPosibles()
            if(this.salasPosibles.length <  1){respuesta = [1];}
            else {respuesta = [0, this.salasPosibles]}
          }
          else if("value" in datetime){
            this.desde = new Date(datetime.value)
            respuesta = [2]  
          }
        }if("duration" in entities){
          if(typeof(this.desde) === 'undefined'){
            respuesta =  [3];
          }
          let sec = entities.duration[0].normalized.value
          this.hasta = new Date(this.desde); 
          this.hasta.setSeconds(this.desde.getSeconds()+sec)
          await this.obtenerSalasPosibles();
          if(this.salasPosibles.length <  1){respuesta = [1];}
          else {respuesta = [0, this.salasPosibles];}
        }
      return respuesta;
    }

    async confirmarReserva(entities){
        let numeroDeSala = entities.number[0].value - 1
        if(numeroDeSala < this.salasPosibles.length){
          return(await graph.reservarSala(this.email, this.token, this.salasPosibles[numeroDeSala], this.desde, this.hasta))
        }
        return(false);
      }

    async obtenerSalasPosibles(){
        const salas = await graph.obtenerSalas(this.token);
        this.salasPosibles = [];
        for(let i = 0; i < salas.length; i++){
          if(await graph.salaEstaDisponible(this.token, salas[i], this.desde.toISOString(), this.hasta.toISOString())){
            this.salasPosibles.push(salas[i])
          }
        }
    }

    async obtenerEventos(){
      let startTime = new Date();
      let endTime = new Date();
      endTime.setDate(endTime.getDate() + 7);
      this.eventosSemana = (await graph.getEvents(this.token, startTime.toISOString(), endTime.toISOString())).value
      return this.eventosSemana;
    }

    async confirmarCancelacion(entities){
      let numeroEvento = entities.number[0].value - 1
      if(numeroEvento < this.eventosSemana.length){
        await graph.deleteEvent(this.token, this.eventosSemana[numeroEvento]);
        return true;
      }
      return(false);
    }
}

module.exports = reservaHelper;