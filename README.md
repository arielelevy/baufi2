<Inserte nombre>

## Asistente (chatbot) para Baufest

## Features:
>- Cotizacion del dolar (Santander Rio)
>- Cotizacion del euro (Santander Rio)
>- Reserva de salas
>- Creacion de appointments

## Instrucciones:
>
> ### Conexión:
>- Es necesario tener el archivos Baufest_POCs.pem en el mismo directorio donde se corre el comando
>- ssh -i Baufest_POCs.pem ubuntu@54.183.160.122

>### Path Absolutos:
>- master : /home/ubuntu/Bot-Poc/master/
>- whatsappBot : /home/ubuntu/Bot-Poc/WhatsappBot/

>### Ejecucion:
>- Nos paramos en cualquiera de los path absolutos que escribimos arriba
>- Verbose : npm start
>- Service : forever start /bin/www
>- Cada vez que se reinicie va a correr master, sin importar que estuviera corriendo antes de reiniciarse. En caso de querer modificarlo utilizar el comando pm2

>### URL:
>- http://54.183.160.122:3000
>- https://pocs.baufest-iot.com