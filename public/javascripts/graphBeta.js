const salas = [
    {
    address: "salarv1cfte@baufest.com",
    name: "Sala RV 1° - CF",
    },
    {
    address: "salarv2cfderecha@baufest.com",
    name: "Sala RV 2° - CF Der",
    },
    {
    address: "salarv2cfizquierda@baufest.com",
    name: "Sala RV 2° - CF Izq",
    },
]

const schedules = {
    "salarv1cfte@baufest.com":[
        1,1,1,1
    ],
    "salarv2cfderecha@baufest.com":[
    ],
    "salarv2cfizquierda@baufest.com":[
    ],
}

module.exports = {
    obtenerSalas: async () =>{
        return salas;
    },
    salaEstaDisponible: async(sala, desde, hasta)=>{
        return schedules[sala].length === 0
    },
    reservarSala: async (sala, desde, hasta) => {
        return true;
    }
}