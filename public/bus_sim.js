var canvas = document.querySelector('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');

console.log(canvas);

// for (var i = 0; i < 5000; i++){
//     var x = Math.random() * window.innerWidth;
//     var y = Math.random() * window.innerHeight;
//     c.beginPath();
//     c.arc(x, y, 30, 0, Math.PI * 2, false);
//     c.strokeStyle = 'red';
//     c.stroke();
// }

var mouse = {
	x: undefined,
	y: undefined
};

window.addEventListener('mousemove', function(event) {
	mouse.x = event.x;
	mouse.y = event.y;
});

window.addEventListener('resize', function(){
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	init();
});

//*************************************************


// mouse interactivity
var dmz = 50;
var resizeRate = 5;
var shiftx = 400;
var shifty = 200

//world variable
//this marks the corners in the path.  Write this in a 'relatively' counter-clockwise fashion
var cornersArray = 
    [[100 + shiftx,100 + shifty], 
    [100 + shiftx,200 + shifty], 
    [200 + shiftx,400 + shifty],
    [600 + shiftx,400 + shifty], 
    [600 + shiftx,500 + shifty], 
    [700 + shiftx,500 + shifty],
    [700 + shiftx,100 + shifty]];
var busStopArray = 
    [[100 + shiftx,100 + shifty], 
    [100 + shiftx,200 + shifty], 
    [200 + shiftx,400 + shifty], 
    [300 + shiftx,400 + shifty],
    [400 + shiftx,400 + shifty], 
    [600 + shiftx,450 + shifty], 
    [700 + shiftx,500 + shifty], 
    [700 + shiftx, 300 + shifty], 
    [300 + shiftx,100 + shifty]];

//this marks the center of the square for the bus stops
var busStopSize = 20;
var busArray = [];
var numBus = 2;
var busSpeed = 0.4;
var busWidth = 10;
var busLength = 50;
var start_index = 1;
var direction = -1; //1 = in direction of cornersArray, -1 = in direction opposite cornersArray
var timer = 100;
var corner_tolerance = 0.5 * busSpeed;
var float_tolerance = 0.0001;

var busStop_tolerance = 10;

var numPeople = 100;
var personArray = [];
var colorArray = [
'#092140','#024959','#F2C777', '#F24738', '#BF2A2A'];
var maxRadius = 50;
var person_radius = 5;
var person_speed_walk = 0.03;
var person_speed_run = 0.06;
var runner_percentage = .2;
var min_BS_dist = 2; //minimum distance that a person has to be to be considered "on" a bus stop
var peopleTimer = 1000;
var person_id = 1;


//**************************************************

function stationaries(){
    //draw path
    for(var i=0; i<cornersArray.length; i++)
    {
         //console.log(cornersArray[i]);
         c.beginPath();
         c.moveTo(cornersArray[i][0],cornersArray[i][1]);
         if(i+1 === cornersArray.length){
             //this makes a closed loop
             c.lineTo(cornersArray[0][0],cornersArray[0][1]);
         } 
         else 
         {
            c.lineTo(cornersArray[i+1][0],cornersArray[i+1][1]);
         }
         c.strokeStyle = "red";
         c.stroke();
    }
    
    //draw bus stops
    for (var i=0; i<busStopArray.length; i++){
         c.fillStyle = "blue";
         c.fillRect(busStopArray[i][0]-busStopSize/2,busStopArray[i][1]-busStopSize/2,busStopSize,busStopSize);
    }
}
function init(){
    stationaries();
    
    //initialize bus
    
    //create a new bus.  the first variable is the index to the corners array. 
    //(meaning that the bus will always start at a corner of the path.
    busArray = [];
    var bus = new Bus(start_index,busSpeed,"green",direction,0, busWidth, busLength );
    busArray.push(bus);
    var bus = new Bus(2,busSpeed,"orange",-direction,1, busWidth, busLength );
    busArray.push(bus);
    
    // people
    peopleArray = [];
    personArray = [];
    for (var i = 0; i < numPeople; i++)
    {
        var x = Math.random() * (innerWidth- 2*person_radius) + person_radius;
        var y = Math.random() * (innerHeight - 2*person_radius) + person_radius;

        var speed = undefined;
        if (Math.random() > runner_percentage)
        {
            speed = person_speed_walk + Math.random() * person_speed_walk;
        } else {
            speed = person_speed_run + Math.random() * person_speed_run;
        }
        var color = colorArray[Math.floor(Math.random() * colorArray.length)];
        var desiredBus = Math.round(Math.random());
        person_id += 1;
        var person = new Person(person_id,x,y,speed,person_radius,color,desiredBus);
        personArray.push(person);
    }
}
function Bus(start_index,speed,color, direction, busNumber, busWidth, busLength){
    this.busNumber = busNumber;
    this.index = start_index;
    this.direction = direction;
    this.speed = speed;
    this.busWidth = busWidth;
    this.busLength = busLength;
    this.x = cornersArray[this.index][0]; 
    this.y = cornersArray[this.index][1];
    this.timer = timer;
    this.previous_dx = -1;
    this.previous_dy = -1;
    //load up values to do trig stuff
    var trig_result = trig_stuff(this.index, this.speed, this.direction);
    this.dx = trig_result.dx;
    this.dy = trig_result.dy;
    this.rotation = trig_result.rotation;
    this.color = color;
    
    this.draw = function() {
        c.fillStyle = this.color;
        c.save();
        c.beginPath();
        c.translate(this.x , this.y );
        c.rotate(this.rotation + Math.PI/2);
        c.fillRect(-this.busWidth/2, -this.busLength/2, this.busWidth, this.busLength);
        c.restore();
    };
    
    this.update = function() {
        this.x += this.dx;
        this.y += this.dy;
        //console.log("x=",this.x);
        //console.log("y=",this.y);
        
        // check to see if we're at a bus stop
        for (var i=0; i< busStopArray.length; i++)
        {
            current_bus_stop_index = i; //just to make things easier to read below
            if (Math.abs(this.x - busStopArray[i][0]) < corner_tolerance 
                    && Math.abs(this.y - busStopArray[i][1]) < corner_tolerance)
            {
                if (this.dx == 0 && this.dy == 0)
                {
                    this.timer -= 1;
                    if (this.timer == 0)
                    {
                        this.dx = this.previous_dx;
                        this.dy = this.previous_dy;
                        this.timer = timer;
                    }
                } 
                else 
                {
                this.previous_dx = this.dx;
                this.previous_dy = this.dy;
                this.dx = 0;
                this.dy = 0;
                this.timer -= 1;
                
                //since we're at a bus stop, look for people to pick up and drop off
                for (var j=0;j<personArray.length;j++)
                { 
//                    if(personArray[j].onBus === true
//                            && personArray[j].desiredStop != i){
//                        personArray[j].numberOfStops -= 1; //decrease the number of stops left until the person gets off.
//                    }
                    
                    if(personArray[j].desiredStop === i
                            && this.busNumber == personArray[j].desiredBus 
                            && personArray[j].onBus === true
                            && personArray[j].rodeBus == true){ //this is where the people get off of the bus.
                        personArray[j].onBus = false; 
                        personArray[j].dx = personArray[j].previous_dx*(Math.sign(Math.random()-0.5));
                        personArray[j].dy = personArray[j].previous_dy*(Math.sign(Math.random()-0.5));
                    }
                    //console.log("person=" + j + " onBus = " + personArray[j].onBus)
                    if
                    (personArray[j].closestStopIndex === current_bus_stop_index //person was headed to that bus stop.
                        && personArray[j].onBus === false //that person is not on the bus
                        && personArray[j].dx ===0 // and that person has stopped moving
                        && personArray[j].dy ===0
                        && this.busNumber == personArray[j].desiredBus //this is the bus they want to get on.
                    )
                    {
                        personArray[j].onBus = true;
                        personArray[j].rodeBus = true;
                        this.timer +=100;
                        //console.log("person=" + j + " onBus= " + personArray[j].onBus);
                        
                    }
                }
                //console.log("--------------------------")
            }
                
            }
        }
        
        
        // check to see if we're at a corner  
        if(this.timer == timer){
            for (var i=0; i<cornersArray.length; i++){
                if (Math.abs(this.x - cornersArray[i][0]) < corner_tolerance 
                        && Math.abs(this.y - cornersArray[i][1]) < corner_tolerance){
                    //We are at a corner, time to correct where we are at:
                    this.x = cornersArray[i][0];
                    this.y = cornersArray[i][1];
                    //now let's update the bus index to this current place so we can update dx and dy;
                    this.index = i;
                    trig_result = trig_stuff(this.index,this.speed,this.direction);
                    this.dx = trig_result.dx;
                    this.dy = trig_result.dy;
                    this.rotation = trig_result.rotation;
                }
            }  
        }
        
        //interactivity
//            if (this.radius === maxRadius){
//                this.showtext = true;
//            } else {
//                this.showtext = false;
//            }
            if (Math.abs(mouse.x - this.x) < dmz && Math.abs(mouse.y - this.y) < dmz )
            {
                if (this.busWidth < 100)
                {
                    this.busWidth += resizeRate;
                    this.busLength += resizeRate;
                }
//                if(this.radius > maxRadius)
//                {
//                    this.radius = maxRadius;
//                }
             } 
             else 
             {
                 if(this.busWidth > busWidth){
                    this.busWidth -= resizeRate;
                    this.busLength -= resizeRate;
                 }
//                if (Math.abs(this.radius - this.origRadius) > 1)
//                {
//                    this.radius -=resizeRate;
//                    if (this.radius < this.origRadius)
//                    {
//                        this.radius = this.origRadius;
//                    }
//                }
             }
        this.draw();
    }; // end of update
}
function trig_stuff(corner_index, speed, direction){
    //load up values to do trig
    var x1 = cornersArray[corner_index][0];
    var y1 = cornersArray[corner_index][1];
    var x2 = undefined;
    var y2 = undefined;
    //deal with end cases first. Here' the wrap around to the beginning
    if(corner_index + direction > cornersArray.length - 1){
        x2 = cornersArray[0][0];
        y2 = cornersArray[0][1];
    }
    //deal with going counterclockwise 
    else if (corner_index + direction < 0){
        x2 = cornersArray[cornersArray.length - 1][0];
        y2 = cornersArray[cornersArray.length - 1][1];
    }
    //now deal with everything else
    else{
        x2 = cornersArray[corner_index + direction][0];
        y2 = cornersArray[corner_index + direction][1];
    }
    var xdist = x2 - x1;
    var ydist = y2 - y1;
    //var hypotenuse = Math.sqrt(Math.pow(xdist,2)+Math.pow(ydist,2));
    //var angle1 = Math.acos(xdist/hypotenuse);
    //var angle2 = Math.asin(ydist/hypotenuse);
    var angle3 = Math.atan(ydist/xdist);
    // a little taste of pythagorums theorem
    var dx = Math.cos(angle3)*speed;
    var dy = Math.sin(angle3)*speed;
    if (xdist < 0 ){ dx = -dx; };
    //if (xdist < 0 && direction == 1){dx = -dx};
    if (ydist < 0 && direction == -1 &&  dy > 0){ dy = -dy; }
    
    return{
        dx: dx,
        dy: dy,
        rotation: angle3
    }
    
}
function getClosestBusStopIndex(x,y){
    var minLength = 999999999;
    var minIndex = undefined;
    for (var i = 0; i < busStopArray.length; i++){
        var xdist = x-busStopArray[i][0];
        var ydist = y-busStopArray[i][1];
        var hypotenuse = Math.sqrt(Math.pow(xdist,2)+Math.pow(ydist,2));
        if (hypotenuse < minLength) {
            minLength = hypotenuse;
            minIndex = i;
        }
    }
    return minIndex;
    
}
function Person(person_id, x, y, speed, radius, color, desiredBus) {
	this.x = x;
	this.y = y;
        this.desiredStop = Math.floor(Math.random()*busStopArray.length);
        this.onBus = false;
        this.rodeBus = false;
        this.desiredBus = desiredBus;
        this.closestStopIndex = getClosestBusStopIndex(this.x, this.y);
        this.speed = speed;
        this.person_id = person_id;
        
        //in order to simulate streets, people will walk to the bus stops in steps, not
        //directly.  Randomly choose who will get what speed below.
        if(Math.random()>0.5){
            this.dx = 0;
            this.dy = this.speed;
        } else {
            this.dx = this.speed;
            this.dy = 0;
        }
        this.previous_dx = this.dx;
        this.previous_dy = this.dy;

	this.radius = radius;
	this.origRadius = radius;
	this.color = color;
        this.showtext = false;

	this.draw = function() {

            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            c.stroke();
            if(this.radius===50){
                c.fillStyle = "black";
            } else {
                c.fillStyle = this.color;
            }
            c.fill(); 

            //Text
            if (this.showtext){
            c.font = "20px Arial";
            c.fillStyle = "red";
            c.textAlign="center";
            c.fillText("x="+ Math.floor(this.x) ,this.x,this.y -10);
            c.fillText("y="+ Math.floor(this.y), this.x,this.y +25);
            //c.fillText("desiredStop= " + this.desiredStop, this.x,this.y + 50);
            //c.fillText("dx= " + this.dx, this.x,this.y + 65);
            //c.fillText("dy= " + this.dy, this.x,this.y + 80);
            //c.fillText("rodeBus= " + this.rodeBus, this.x,this.y + 95);
            //c.fillText("onBus= " + this.onBus, this.x,this.y + 110);
            //c.fillText("person_id= " + this.person_id, this.x,this.y + 125);
            }
	};

	this.update = function() {
            if (this.onBus){
                this.x=busArray[this.desiredBus].x;
                this.y=busArray[this.desiredBus].y;
            }
            else if (this.rodeBus === false)
            {
            xdist = busStopArray[this.closestStopIndex][0] - this.x;
            ydist = busStopArray[this.closestStopIndex][1] - this.y;
            
            if (Math.abs(xdist) <= min_BS_dist 
                    && Math.abs(ydist) <= min_BS_dist
                    && this.rodeBus === false){
                this.dx = 0;
                this.dy = 0;
            }
            else if (Math.abs(this.dx) > 0)
            {
                if(Math.abs(xdist) > min_BS_dist){
                    this.dx = Math.sign(xdist)*this.speed;
                    this.dy = 0;
                } else {
                    this.dx = 0;
                    this.dy = Math.sign(ydist) * this.speed;
                }
                
            } else if (Math.abs(this.dy) > 0){
                if(Math.abs(ydist) > min_BS_dist){
                    this.dx = 0;
                    this.dy = Math.sign(ydist) * this.speed;
                } else {
                    this.dx = Math.sign(xdist) * this.speed;
                    this.dy = 0;
                }
            }    
        
            this.x+=this.dx;
            this.y+=this.dy;

            } else {
            this.x+=this.dx;
            this.y+=this.dy;
            }
            //interactivity
            if (this.radius === maxRadius){
                this.showtext = true;
            } else {
                this.showtext = false;
            }
            if (Math.abs(mouse.x - this.x) < dmz && Math.abs(mouse.y - this.y) < dmz )
            {
                if (this.radius < maxRadius)
                {
                    this.radius += resizeRate;
                }
                if(this.radius > maxRadius)
                {
                    this.radius = maxRadius;
                }
             } 
             else 
             {
                if (Math.abs(this.radius - this.origRadius) > 1)
                {
                    this.radius -=resizeRate;
                    if (this.radius < this.origRadius)
                    {
                        this.radius = this.origRadius;
                    }
                }
             }
  
            this.draw();


	};
}
function makingPeople(){
    //this is used when the personArray is < 100 to make new people but on a timer
    if (peopleTimer === 0 ){
        var x = Math.random() * (innerWidth- 2*person_radius) + person_radius;
        var y = Math.random() * (innerHeight - 2*person_radius) + person_radius;

        var speed = undefined;
        if (Math.random() > runner_percentage)
        {
            speed = person_speed_walk + Math.random() * person_speed_walk;
        } else {
            speed = person_speed_run + Math.random() * person_speed_run;
        }
        var color = colorArray[Math.floor(Math.random() * colorArray.length)];
        var desiredBus = Math.round(Math.random());;
        var person = new Person(person_id,x,y,speed,person_radius,color,desiredBus);
        person_id += 1;
        personArray.push(person);
    } else {
        peopleTimer -= 1;
    }
}
function animate() {
	requestAnimationFrame(animate);
	c.clearRect(0,0,innerWidth,innerHeight);
        stationaries();
	for (var i=0; i< busArray.length; i++){
		busArray[i].update();
	}
        for (var i=0; i< personArray.length; i++){
		personArray[i].update();
	}
        //I'm not sure this is the right place for this... but..
        //get rid of out of bounds... iterate backwards
        for (var i = personArray.length - 1; i >= 0; i--) 
        {
            if (personArray[i].x < 20 
                    || personArray[i].y < 20 
                    || personArray[i].x > (canvas.width - 20) 
                    || personArray[i].y > (canvas.height - 20))     
            {
                //get rid of people that are exiting the area.
                    personArray.splice(i, 1);
                    console.log("personArray length=" + personArray.length);
            }
        }
        if(personArray.length < numPeople*0.9){
            makingPeople();
        }
}
init();
animate();