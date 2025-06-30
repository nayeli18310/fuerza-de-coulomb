const k = 8.9875517923e9;

function convertir(valor, unidad) {
  return valor * parseFloat(unidad);
}

function obtenerCarga(id, modo, lado) {
  const q = parseFloat(document.getElementById(`q${id}`).value);
  const unidad = document.getElementById(`unit${id}`).value;
  let x = 0, y = 0;

  if (modo === "coordenadas") {
    x = parseFloat(document.getElementById(`x${id}`).value);
    y = parseFloat(document.getElementById(`y${id}`).value);
  } else {
    // Posiciones automáticas para triángulo equilátero
    if (id === 1) {
      x = -lado / 2;
      y = 0;
    } else if (id === 2) {
      x = lado / 2;
      y = 0;
    } else if (id === 3) {
      x = 0;
      y = (Math.sqrt(3) / 2) * lado;
    }
  }

  if (isNaN(q)) {
    alert(`Falta el valor de la carga ${id}`);
    return null;
  }
  if (isNaN(x) || isNaN(y)) {
    alert(`Faltan coordenadas o distancia en carga ${id}`);
    return null;
  }

  return {
    q: convertir(q, unidad),
    x,
    y
  };
}

function calcularFuerza(qj, qi, dx, dy) {
  const r = Math.sqrt(dx ** 2 + dy ** 2);
  if (r === 0) return { fx: 0, fy: 0 };
  const magnitud = k * Math.abs(qj * qi) / (r ** 2);
  const signo = Math.sign(qj * qi) === -1 ? 1 : -1;
  return {
    fx: signo * magnitud * dx / r,
    fy: signo * magnitud * dy / r
  };
}

function simular() {
  const modo = document.getElementById("modoEntrada").value;
  const lado = modo === "distancia" ? parseFloat(document.getElementById("r1").value) : null;

  if (modo === "distancia" && (isNaN(lado) || lado <= 0)) {
    alert("Por favor ingresa una distancia válida para el triángulo.");
    return;
  }

  const c1 = obtenerCarga(1, modo, lado);
  const c2 = obtenerCarga(2, modo, lado);
  const c3 = obtenerCarga(3, modo, lado);
  if (!c1 || !c2 || !c3) return;

  const cargas = [c1, c2, c3];
  const unidades = [
    document.getElementById("unit1").value,
    document.getElementById("unit2").value,
    document.getElementById("unit3").value
  ];

  const canvas = document.getElementById("lienzo");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const offset = 200;
  const escala = 100;

  // Dibujar cargas
  cargas.forEach((c, i) => {
    const px = offset + c.x * escala;
    const py = offset - c.y * escala;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, 2 * Math.PI);
    ctx.fillStyle = c.q > 0 ? 'red' : 'blue';
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillText(`q${i + 1}`, px + 12, py);
  });

  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "";

  // Calcular fuerzas entre pares
  const pares = [[0, 1], [0, 2], [1, 2]];
  pares.forEach(([i, j]) => {
    const dx = cargas[j].x - cargas[i].x;
    const dy = cargas[j].y - cargas[i].y;
    const f = calcularFuerza(cargas[i].q, cargas[j].q, dx, dy);
    const mag = Math.sqrt(f.fx ** 2 + f.fy ** 2).toFixed(2);

    resultadosDiv.innerHTML += `<p>Fuerza entre q${i + 1} y q${j + 1}: ${mag} N</p>`;

    // Dibujar vector
    ctx.beginPath();
    ctx.moveTo(offset + cargas[j].x * escala, offset - cargas[j].y * escala);
    ctx.lineTo(
      offset + (cargas[j].x + f.fx * 1e-7) * escala,
      offset - (cargas[j].y + f.fy * 1e-7) * escala
    );
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Fuerzas netas
  const fuerzasNetas = cargas.map(() => ({ fx: 0, fy: 0 }));
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === j) continue;
      const dx = cargas[i].x - cargas[j].x;
      const dy = cargas[i].y - cargas[j].y;
      const f = calcularFuerza(cargas[j].q, cargas[i].q, dx, dy);
      fuerzasNetas[i].fx += f.fx;
      fuerzasNetas[i].fy += f.fy;
    }
  }

  resultadosDiv.innerHTML += `<h3>Fuerzas netas:</h3>`;
  fuerzasNetas.forEach((f, i) => {
    const mag = Math.sqrt(f.fx ** 2 + f.fy ** 2);
    const texto = mag < 1e-3 ? mag.toExponential(3) : mag.toFixed(3);
    resultadosDiv.innerHTML += `<p>q${i + 1}: Fx = ${f.fx.toFixed(2)} N, Fy = ${f.fy.toFixed(2)} N → <b>F = ${texto} N</b></p>`;

    // Dibujo
    ctx.beginPath();
    ctx.moveTo(offset + cargas[i].x * escala, offset - cargas[i].y * escala);
    ctx.lineTo(
      offset + (cargas[i].x + f.fx * 1e-7) * escala,
      offset - (cargas[i].y + f.fy * 1e-7) * escala
    );
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function actualizarModo() {
  const modo = document.getElementById("modoEntrada").value;
  const mostrarCoord = modo === "coordenadas";
  document.getElementById("globalAnguloContainer").style.display = "none"; // ya no se usa

  for (let i = 1; i <= 3; i++) {
    document.querySelector(`#c${i} .coordenadas`).style.display = mostrarCoord ? "block" : "none";
    document.querySelector(`#c${i} .distancia`).style.display = mostrarCoord ? "none" : "block";
  }
}

