window.onload = function() {

	let canvas = document.getElementById("myCanvas");
	let ctx = canvas.getContext("2d");

	let showSprings = true;
	let m = 1;
	let k = 20;
	let damping = 0.3;

	let timestep = 0.1;

	class Point {
	
		constructor(x, y, isAnchor) {
			this.x = x;
			this.y = y;
			this.velocityX = 0;
			this.velocityY = 0;
			this.isAnchor = isAnchor || false;
		}
		
	}

	class Spring {
	
		constructor(point1, point2, restLengthX, restLengthY) {
			this.point1 = point1;
			this.point2 = point2;
			this.restLengthX = restLengthX || (point1.x - point2.x);
			this.restLengthY = restLengthY || (point1.y - point2.y);
		}
		
	}

	// points
	let points = [];
	//createPolygonPoints(400, 300, 100, 10);
	createSquarePoints(300, 300, 7, 50);
	//createRandomPoints(400, 300, 150, 150, 30);
	let minLength = 49;
	let maxLength = 51;

	function createRandomPoints(x, y, w, h, count) {

		// anchor point in center
		points.push(new Point(x, y, true));

		let hullSpace = 10;

		for (let i = 0; i < count; i++) {
			let pixelX = Math.random() * (w - 2 * hullSpace) + x - w/2 + hullSpace;
			let pixelY = Math.random() * h + y - h/2;
			points.push(new Point(pixelX, pixelY));
		}
	}

	function createSquarePoints(x, y, aNum, springLength) {

		for (let i = 0; i < aNum; i++) {
			for (let j = 0; j < aNum; j++) {
				let newPoint = null;

				let newX = x + i*springLength;
				let newY = y + j*springLength;
				newPoint = new Point(newX, newY);

				points.push(newPoint);
			}
		}

		points[0].isAnchor = true;

	}

	function createPolygonPoints(xCenter, yCenter, r, vertices) {
		
		// anchor point in center
		points.push(new Point(xCenter, yCenter, true));

		for (var i = 0; i < vertices; i++) {
			let newX = r * Math.cos(2*Math.PI*i/vertices) + xCenter;
			let newY = r * Math.sin(2*Math.PI*i/vertices) + yCenter;

			newPoint = new Point(newX, newY);
			points.push(newPoint);
		}
	}

	// springs
	let springs = [];
	createSprings(maxLength, minLength);

	// create springs from center to all points
	function createSprings(maxLength, minLength) {

		let anchorPoint = points.find(p => p.isAnchor);

		for (let i = 0; i < points.length; i++) {
			for (let j = 0; j < points.length; j++) {

				if (i != j) {
					let dx = Math.abs(points[i].x - points[j].x);
					let dy = Math.abs(points[i].y - points[j].y);
					let d = Math.sqrt(dx**2 + dy**2);
					if (d <= maxLength && d >= minLength) {
						springs.push(new Spring(points[i], points[j]));
					}
				}
			}
		}

	}

	// mass = 1, so force = acceleration
	function update() {

		for (let i = 0; i < springs.length; i++) {
			let spring = springs[i];

			// spring length
			let springLengthX = spring.point1.x - spring.point2.x;
			let springLengthY = spring.point1.y - spring.point2.y;

			// point1 spring force
			let springForceX = -k * (springLengthX - spring.restLengthX);
			let springForceY = -k * (springLengthY - spring.restLengthY);
			let accelerationX = springForceX / m;
			let accelerationY = springForceY / m;

			// point1 damping
			let dampingForceX1 = damping * (spring.point1.velocityX);
			let dampingForceY1 = damping * (spring.point1.velocityY);

			// point2 damping
			let dampingForceX2 = damping * (spring.point2.velocityX);
			let dampingForceY2 = damping * (spring.point2.velocityY);

			// point1 net force
			let forceX1 = springForceX - dampingForceX1;
			let forceY1 = springForceY - dampingForceY1;

			// point2 net force
			let forceX2 = -springForceX - dampingForceX2;
			let forceY2 = -springForceY - dampingForceY2;

			// point1 acceleration
			let accelerationX1 = forceX1 / m;
			let accelerationY1 = forceY1 / m;

			// point2 acceleration
			let accelerationX2 = forceX2 / m;
			let accelerationY2 = forceY2 / m;

			// update points
			if (!spring.point1.isAnchor) {
				spring.point1.velocityX += accelerationX1 * timestep;
				spring.point1.velocityY += accelerationY1 * timestep;
			}

			if (!spring.point2.isAnchor) {
				spring.point2.velocityX += accelerationX2 * timestep;
				spring.point2.velocityY += accelerationY2 * timestep;
			}

		}

		for (let i = 0; i < points.length; i++) {
			let point = points[i];

			// point position
			point.x += point.velocityX * timestep;
			point.y += point.velocityY * timestep;

		}
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (isAnchorSelected) {
			//points[0].x -= 6;
			//points[0].y -= 6;
		}

		for (let i = 0; i < points.length; i++) {
			let point = points[i];

			ctx.beginPath();
			ctx.arc(point.x, point.y, 2, 0, 2*Math.PI);
			ctx.fill();
			ctx.stroke();
		}

		if (showSprings) {
			for (let i = 0; i < springs.length; i++) {
				let spring = springs[i];

				ctx.moveTo(spring.point1.x, spring.point1.y);
				ctx.lineTo(spring.point2.x, spring.point2.y);
				
				ctx.stroke();
			}
		}
	}

	// mouse events
	let mousedown = false;
	let isAnchorSelected = false;
	canvas.addEventListener("mousemove", onMouseMove, false);
	canvas.addEventListener("mousedown", onMouseDown, false);
	canvas.addEventListener("mouseup", onMouseUp, false);

	function onMouseMove(e) {
		if (isAnchorSelected) {
			
			let mouseX = e.clientX - canvas.offsetLeft;
			let mouseY = e.clientY - canvas.offsetTop;

			points[0].x = mouseX;
			points[0].y = mouseY;
			
		}
	}

	function onMouseDown() {
		isAnchorSelected = true;
	}

	function onMouseUp() {
		isAnchorSelected = false;		
	}

	setInterval(function() {
		update();
		draw();
	}, timestep * 1000);

};