# swip

![alt tag] (https://github.com/paulsonnentag/swip/blob/master/pong/public/assets/img/example_swip.jpg)
- Swip Markup  -> just pinch to the edges and you're ready to go

![alt tag] (https://j.gifs.com/0R7753.gif)
- Swip Photo Share

![alt tag] (https://j.gifs.com/9rNEQB.gif)
- Swip Pong Clone

<h3>Inspiration</h3>
<p>The idea behind this tool was to use 2 or more different devices (e. g. Smartphones) to create a bigger screen, quickly exchange Data and create new game pattern mechanics (like pong with shifted screens). So we decided to try it out in the 24 hours Inno-{Hacks} hackathon at the DHBW Karlsruhe.</p>
<br />

<h3>What we build</h3>
<p>We created 2 example applications to show the capabilities of such a system. The first is a pong clone which let's you play with 2 different devices. Yes, even with different sizes! You just hold the devices next to each other an *swip* over both, pinching the thumb and indexfinger to the edge. That's it, you're now ready to play.
<br />
The second example is </p>
<br />

<h3>How we built it</h3>
<p>To provide a wide coverage of all the different devices out there, our choice was javascript. For the connection websockets were the best choice, so we used Socket.io.  For the pong game, the canvas Element was the perfect choice.</p>
<br />

<h3>Challenges we ran into</h3>
<p>The Time synchronization between the devices was a real big problem, because we wanted a smooth transition from one screen to the next. The different pixel-density was another quite big problem, since the different manufacturers (Apple, Samsung, HTC) have different resolutions and density, we had to find a way to scale the content according to the devices density.</p>
<br />

<h3>Built With</h3>
<p>Javascript, HTML, CSS, Socket.io, Express, Node.js</p>
<br />

<h3>Screenshots</h3>
![alt tag] (https://github.com/paulsonnentag/swip/blob/master/pong/public/assets/img/example_screenExtend.jpg)
- Example of the extended screen concept
![alt tag] (https://github.com/paulsonnentag/swip/blob/master/pong/public/assets/img/pong_clone_example.jpg)
- Example of the Pong clone

<br />
<p>P.S. it's a prototype</p>

