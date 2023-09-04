const words = [
    {
      origin: "Eliasito",
      category: "names"
    },
    {
      origin: "Danielito",
      category: "names"
    },
    {
      origin: "Eliasito",
      category: "countries"
    },
    {
      origin: "Danielito",
      category: "countries"
    }
]
const categories = [{category: "names", finished: true}, {category: "countries", finished: true}]

function orderedCategories() {
  const categories_ = categories.map(obj => {return obj.category});
  
  switch (categories_.length) {
    case 2:
      var category0 = words.filter((word) => word.category == categories_[0]); // filtramos los elementos con category 1
      var category1 = words.filter((word) => word.category == categories_[1]); // filtramos los elementos con category 2

      var orderedCategories = [...[category0], ...[category1]]; // usamos el operador spread para unir los arrays en uno nuevo
      console.log('case 2:')
      console.log(orderedCategories)
      break;
    case 3:
      var category0 = words.filter((word) => word.category == categories_[0]); // filtramos los elementos con category 1
      var category1 = words.filter((word) => word.category == categories_[1]); // filtramos los elementos con category 2
      var category2 = words.filter((word) => word.category == categories_[2]); // filtramos los elementos con category 3

      var orderedCategories = [...[category0], ...[category1], ...[category2]]; // usamos el operador spread para unir los arrays en uno nuevo
      console.log('case 3:')
      console.log(orderedCategories)
      break;
    case 4:
      var category0 = words.filter((word) => word.category == categories_[0]); // filtramos los elementos con category 1
      var category1 = words.filter((word) => word.category == categories_[1]); // filtramos los elementos con category 2
      var category2 = words.filter((word) => word.category == categories_[2]); // filtramos los elementos con category 3
      var category3 = words.filter((word) => word.category == categories_[3]); // filtramos los elementos con category 4

      var orderedCategories = [...[category0], ...[category1], ...[category2], ...[category3]]; // usamos el operador spread para unir los arrays en uno nuevo
      console.log('case 4:')
      console.log(orderedCategories)
      break;
  }
}

orderedCategories();