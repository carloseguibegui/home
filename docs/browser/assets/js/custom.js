function sendEmail(event) {
    event.preventDefault();  // Evita que el formulario recargue la página
    // Mostrar el indicador de carga
    document.querySelector(".loading").style.display = "block";
    
    // Recoge los datos del formulario
    const templateParams = {
        from_name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value   
    };
    
    // Enviar correo a través de EmailJS
    emailjs.send("service_3hgo7aj", "template_e8swpti", templateParams)
        .then(function(response) {
            // Ocultar la carga y mostrar mensaje de éxito
            document.querySelector(".loading").style.display = "none";
            document.querySelector(".sent-message").style.display = "block";
        }, function(error) {
            // Ocultar la carga y mostrar mensaje de error
            document.querySelector(".loading").style.display = "none";
            document.querySelector(".error-message").innerText = "Hubo un error al enviar el mensaje. Inténtalo nuevamente.";
            document.querySelector(".error-message").style.display = "block";
        });
}
document.addEventListener('DOMContentLoaded', function () {
    const videos = document.getElementsByClassName('video-mp4');

    // Utilizando IntersectionObserver para detectar cuando el video está en el viewport
    const observer0 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                videos[0].play();  // Reproducir videos cuando está visible
            } else {
                videos[0].pause(); // Pausar videos cuando sale del viewport
            }
        });
    }, {
        threshold: 0.5 // El videos debe estar al menos un 50% visible para reproducirse
    });

    observer0.observe(videos[0]);

    const observer1 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                videos[1].play();  // Reproducir videos cuando está visible
            } else {
                videos[1].pause(); // Pausar videos cuando sale del viewport
            }
        });
    }, {
        threshold: 0.5 // El videos debe estar al menos un 50% visible para reproducirse
    });

    observer1.observe(videos[0]);

    const observer2 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                videos[2].play();  // Reproducir videos cuando está visible
            } else {
                videos[2].pause(); // Pausar videos cuando sale del viewport
            }
        });
    }, {
        threshold: 0.5 // El videos debe estar al menos un 50% visible para reproducirse
    });

    observer2.observe(videos[2]);

    const observer3 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                videos[3].play();  // Reproducir videos cuando está visible
            } else {
                videos[3].pause(); // Pausar videos cuando sale del viewport
            }
        });
    }, {
        threshold: 0.5 // El videos debe estar al menos un 50% visible para reproducirse
    });

    observer3.observe(videos[3]);

    const observer4 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                videos[4].play();  // Reproducir videos cuando está visible
            } else {
                videos[4].pause(); // Pausar videos cuando sale del viewport
            }
        });
    }, {
        threshold: 0.5 // El videos debe estar al menos un 50% visible para reproducirse
    });

    observer4.observe(videos[4]);
});


function snow_fall() {

    const canvas = document.getElementById('snow_fall');
    const ctx = canvas.getContext('2d');
  
    // Set the canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
  // Set Propoties
  const numDots = 125;
  const direction = 0.5;
  const speed = 4.95;
  const size = 3.5;
  const dotColor = 'rgba(240,245,255,0.5)';
  
    // Set the initial dot positions
    const dots = [];
    for (let i = 0; i < numDots; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      });
    }
    const rand = []
    for (i = 0; i < numDots; i++) {
      var random_num = Math.random() + 0.2;
      rand.push(random_num)
    }
  
    function drawDots() {
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    
      // Draw
      for (let i = 0; i < numDots; i++) {
        ctx.beginPath();
        ctx.fillStyle = dotColor;
        ctx.arc(dots[i].x, dots[i].y, (rand[i] ** size) + (size / 1.5), 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  
        function updateDots() {
        // Update the dot positions
          for (let i = 0; i < numDots; i++) {
            dots[i].y += (speed / 2) + ((Math.sin(rand[i]) * 1.25) * speed);
            dots[i].x += (Math.cos((dots[i].y * (Math.sqrt(speed) / speed / 10))) * ((Math.sqrt(Math.sqrt(speed) ** 1.3) - 0.15)) / 4) + direction;
            
            if (dots[i].y > canvas.height) {
              // Reset the dot position and speed
              dots[i].y = 0;
            } else if (dots[i].x > canvas.width) {
              dots[i].x = 0;
            }  else if (dots[i].x < 0) {
              dots[i].x = canvas.width;
            }
          }
        }
  
        // Animate the dots
        function animate() {
          // Update the dot positions
          updateDots();
  
          // Draw the dots
          drawDots();
          // Request the next animation frame
          requestAnimationFrame(animate);
        }
  
        // Start the animation
        animate();
  }
  snow_fall();