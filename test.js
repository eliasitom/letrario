function asignarPaises(personas, paises) {
  var nuevoArray = [];
  var contador = 0;

  for (var i = 0; i < personas.length; i++) {
    var persona = personas[i];
    var paisesAsignados = [];

    for (var j = contador; j < contador + 3 && j < paises.length; j++) {
      paisesAsignados.push(paises[j]);
    }

    nuevoArray.push({ nombre: persona, paises: paisesAsignados });
    contador += 3;
  }

  return nuevoArray;
}

var paises = ["Uruguay", "Argentina", "Brasil", "Chile", "Perú", "Colombia", "Ecuador", "Canada", "Cosa Rica", "Japon", "Corea del Norte", "Corea del Sur", "Suiza", "Suecia", "Noruega"];
var personas = ["Juan", "María", "Carlos"];

var resultado = asignarPaises(personas, paises);
console.log(resultado);
