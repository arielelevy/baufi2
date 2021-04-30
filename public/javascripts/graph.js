var graph = require('@microsoft/microsoft-graph-client');
const edificio = "SalasReunionRoosevelt@baufestcloud.onmicrosoft.com";
module.exports = {
  getUserDetails: async function(accessToken) {
    const client = getAuthenticatedClient(accessToken);
    const user = await client.api('/me').get();
    return user;
  },
  
  deleteEvent: async function(accessToken, evento){
    const client = getAuthenticatedClient(accessToken);
    await client.api("/me/events/"+ evento.id).del();
    return true;
  },

  getEvents: async function(accessToken, startTime, endTime) {
    const client = getAuthenticatedClient(accessToken);
    const query = {
      "startDateTime" : startTime,
      "endDateTime" : endTime
    };
    const events = await client
      .api('/me/calendar/calendarView')
      .query(query)
      .select('id,subject,start,end')
      .orderby('createdDateTime DESC')
      .get();
    return events;
  },

  obtenerSalas: async function(accessToken) {
    const client = getAuthenticatedClient(accessToken);
    const listRoom = await client
      .api("/me/findRooms(RoomList='SalasReunionRoosevelt@baufestcloud.onmicrosoft.com')")
      .get();
    return listRoom.value
  },

  salaEstaDisponible: async function(accessToken, sala, desde, hasta ) {
    const client = getAuthenticatedClient(accessToken);
    const content = {
      "schedules": [sala.address],
      "startTime": {
          "dateTime": desde,
          //"timeZone": "UTC"
      },
      "endTime": {
          "dateTime": hasta,
          //"timeZone": "UTC"
      },
      "availabilityViewInterval": "6"
    };
    const schedules = await client
      .api("/me/calendar/getSchedule")
      .post(content);
    return (schedules.value[0].scheduleItems.length === 0)
  },

  reservarSala: async function(email, accessToken, sala, desde, hasta) {
    const client = getAuthenticatedClient(accessToken);
    const content = {
      "subject": "Esta reserva ha sido realizada por Baufi",
      "body": {
        "contentType": "HTML",
        "content": "Reserva realizada a través de Baufi"
      },
      "start": {
          "dateTime": desde,
          "timeZone": "utc"
      },
      "end": {
          "dateTime": hasta,
          "timeZone": "utc"
      },
      "location":{
          "displayName":sala.name
      },
      "attendees": [
        {
          "emailAddress": {
            "address": sala.address,
            "name": sala.name
          },
          "type": "required"
        },
        {
          "emailAddress": {
            "address":email,
          },
          "type": "required"
        }
      ]
    };
    try{
      const schedules = await client
        .api("/me/calendar/events")
        .post(content);
      return true;
    }catch(err){
      return false
    }
  },



};

function getAuthenticatedClient(accessToken) {
  // Initialize Graph client
  const client = graph.Client.init({
    // Use the provided access token to authenticate
    // requests
    authProvider: (done) => {
      done(null, accessToken);
    },
    defaultVersion:"beta"
    //baseUrl : "https://graph.microsoft.com/beta/"
  });

  return client;
}