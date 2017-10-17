var canvas = document.querySelector('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');

// c.fillStlye = 'rgba(255,0,0,0.1)'; 
// c.fillRect(100,100,100,100);
// c.fillStyle = 'blue'
// c.fillRect(400,100,100,100);
// c.fillStyle = '#00FF00'
// c.fillRect(300,300,100,100);

console.log(canvas);

//lines

// c.beginPath();
// c.moveTo(50,300);
// c.lineTo(300, 100);
// c.lineTo(400,300);
// c.strokeStyle = "#fa34a3"
// c.stroke();



// for (var i = 0; i < 5000; i++){
//     var x = Math.random() * window.innerWidth;
//     var y = Math.random() * window.innerHeight;
//     c.beginPath();
//     c.arc(x, y, 30, 0, Math.PI * 2, false);
//     c.strokeStyle = 'red';
//     c.stroke();
//     console.log('beerj');
// }
var mouse = {
	x: undefined,
	y: undefined
}

window.addEventListener('mousemove', function(event) {
	//console.log(event);
	mouse.x = event.x;
	mouse.y = event.y;
})

window.addEventListener('resize', function(){
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	init()
})
var dmz = 200
var radius_multiplier = 30;
var speed_multiplier = 10;

var maxRadius = 50;
var resizeRate = 5;
var numCircles = 50
var circleArray = [];
var colorArray = [
'#092140','#024959','#F2C777', '#F24738', '#BF2A2A'];

function init(){
	circleArray = [];
	for (var i = 0; i < numCircles; i++){

	var radius = (Math.random()) * radius_multiplier;
	var x = Math.random() * (innerWidth- 2*radius) + radius;
	var y = Math.random() * (innerHeight - 2*radius) + radius;
	
	
	var dx = (Math.random() - 0.5) * speed_multiplier;
	var dy = (Math.random() - 0.5) * speed_multiplier;
	var color = colorArray[Math.floor(Math.random() * colorArray.length)]
	var circle = new Circle(x,y,dx,dy,radius,color);
	circleArray.push(circle);

	}
}

function Circle(x, y, dx, dy, radius, color) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.radius = radius
	this.origRadius = radius;
	this.color = color

	this.draw = function() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.stroke();
		c.fillStyle = this.color
		c.fill();
	}

	this.update = function() {
		if( this.x + radius > innerWidth || this.x - radius < 0){
			this.dx = -this.dx
		}
		if( this.y + radius > innerHeight || this.y - radius < 0){
			this.dy = -this.dy
		}
		this.x+=this.dx;
		this.y+=this.dy;


		//interactivity
		
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


	}
}


// var circle = new Circle(200,200,4,4);
// circle.draw();


//arc / circle
// c.beginPath();
// c.arc(200, 200, 30, 0, Math.PI * 2, false);
// c.strokeStyle = 'red';
// c.stroke();
// console.log('beerj');








function animate() {
	requestAnimationFrame(animate);
	//c.clearRect(0,0,innerWidth,innerHeight);
	for (var i=0; i<circleArray.length; i++){
		circleArray[i].update();
	}
	
	//console.log('inside animate');
	// c.beginPath();
	// c.arc(x, y, radius, 0, Math.PI * 2, false);
	// c.strokeStyle = 'red';
	// c.stroke();
	//console.log('beerj');
	
}

init();
animate();