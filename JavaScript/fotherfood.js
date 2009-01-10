/*
    Fotherfood shopping list generator
    Copyright (C) 2008-2009  Tom Fotherby

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// =========================================================================
// ========================  G  L  O  B  A  L  S  ==========================
// =========================================================================

var CategoryArray    = new Array();
var RecipeArray      = new Array();
var RegularItemArray = new Array();
var theShoppingList  = new ShoppingList();

// =========================================================================
// ==========  C  L  A  S  S     D  E  F  I  N  I  T  I  O  N  S  ==========
// =========================================================================

///////////////////////////////////////////////////////////////////////
// Class to define a recipe ingredient
function SingleIngredient(nameInShop,prettyName,amount,units,category)
{
  this.nameInShop         = nameInShop;
  this.prettyName         = prettyName;
  this.amount             = amount;
  this.units              = units;
  this.unitConversionNote = "";
  this.category           = category;
}

///////////////////////////////////////////////////////////////////////
// Class to define a entire recipe
function SingleRecipe(recipeName,numOfPortions,recipeSource)
{
  this.name           = recipeName;
  this.numOfPortions  = numOfPortions
  this.source         = recipeSource;
  this.numWanted      = 0;
  this.ingredientList = new Array();
  this.weightWatcherPoints = -1;
  this.prepAndCookingTime = "";
}

///////////////////////////////////////////////////////////////////////
// Class to define a Shopping List (i.e a list of ingredients and a method to add and remove them)
function ShoppingList()
{
  this.ingredientList = new Array();
  this.addSingleItem=sumIdenticalIngredients;
  this.addRecipe=ShoppingListAddRecipe;
  this.removeSingleItem=subtractIngredients;
  this.removeRecipe=ShoppingListRemoveRecipe;
  this.sort=ShoppingListSort;
}

  // method of the ShoppingList class to sum Identical Ingredients
  function sumIdenticalIngredients(item)
  {
   // First see if the ingredient already exists in the list
   var targetIngredientIndex = -1;
   for (var i in this.ingredientList)
       if (this.ingredientList[i].nameInShop == item.nameInShop) 
       {
	   targetIngredientIndex = i;
	   // Add a warning in case mismatched units have been entered in the recipe XML file
	   if (this.ingredientList[i].units != item.units)
	       if (this.ingredientList[i].units == "g" && item.units == "tsp") {
		   item.amount = 5*item.amount; // 1 tsp is 5 grams
	       } else if (this.ingredientList[i].units == "tsp" && item.units == "tbsp") {
		   item.amount = 3*item.amount; // 1 tbsp is 3 tsp
	       } else
	       this.ingredientList[i].unitConversionNote = " - Error! Unit mismatch. Can't add \"" + this.ingredientList[i].units + "\" with \"" + item.units + "\". Please unify units in XML and reload.";
	   else
	       this.ingredientList[i].unitConversionNote = "";
       }

   // If the ingredient doesn't exist, create it, else add to it.
   if (targetIngredientIndex < 0) {
     var newIngredient = new SingleIngredient(item.nameInShop,item.prettyName,item.amount,item.units,item.category);
     this.ingredientList.push(newIngredient);
   } else {
     this.ingredientList[targetIngredientIndex].amount += item.amount;
   }
  }
  // method of the ShoppingList class to remove Ingredients
  function subtractIngredients(item)
  {
   for (var i in this.ingredientList)
      if (this.ingredientList[i].nameInShop == item.nameInShop)
      {
         this.ingredientList[i].amount -= item.amount;

	 if (this.ingredientList[i].unitConversionNote != "");
	     this.ingredientList[i].unitConversionNote = "";

         if (this.ingredientList[i].amount <= 0)
           delete this.ingredientList[i];
      }
  }
  function ShoppingListAddRecipe(recipe)
  {
      recipe.numWanted++;
      for (var j in recipe.ingredientList) 
         this.addSingleItem(recipe.ingredientList[j]);
  }
  function ShoppingListRemoveRecipe(recipe)
  {
      if (recipe.numWanted > 0)
      {
        recipe.numWanted--;
        for (var j in recipe.ingredientList) 
           this.removeSingleItem(recipe.ingredientList[j]);
      }
  }
  function ShoppingListSort()
  {
   var ingredientKeys       = new Array();
   var sortedIngredientList = new Array();

   // Build an array of keys
   for (var i in this.ingredientList)
      ingredientKeys.push(this.ingredientList[i].nameInShop);

   // Sort the array of keys and then use it to re-create the array of ingredients.
   for (var item1 in ingredientKeys.sort())
     for (var item2 in this.ingredientList)
        if (ingredientKeys[item1] == this.ingredientList[item2].nameInShop)
          sortedIngredientList.push(this.ingredientList[item2]);

   this.ingredientList = sortedIngredientList;
  }

// =========================================================================
// =========  A  U  X  I  L  I  R  Y      F  U  N  C  T  I  O  N  S  =======
// =========================================================================

///////////////////////////////////////////////////////////////////////
// Browser independant method to add events to a Object (See http://www.faqts.com/knowledge_base/view.phtml/aid/9592)
function eventAdder(objAttrib,handler,addFunction)
{
   //if NN6 then OK to use the standard setAttribute     
   if ((!document.all)&&(document.getElementById)){
       objAttrib.setAttribute(handler,addFunction);
   }    
   //workaround for IE 5.x
   if ((document.all)&&(document.getElementById)){
       objAttrib[handler]=new Function(addFunction);
   }
}

///////////////////////////////////////////////////////////////////////
// Expand or collapse a element with an id.
function showHide(elementid)
{
   if (document.getElementById(elementid).style.display == 'none'){
      document.getElementById(elementid).style.display = '';
   } else {
      document.getElementById(elementid).style.display = 'none';
   }
} 

///////////////////////////////////////////////////////////////////////
// Add or remove recipes to the shopping list
function modifyRecipiesInShoppingList(recipeName,incOrDec)
{
  for (var i in RecipeArray)
  {
    var recipe = RecipeArray[i];
    if (recipe.name == recipeName) 
    {
      if (incOrDec == "+") 
        theShoppingList.addRecipe(recipe);
      else
        theShoppingList.removeRecipe(recipe);

      // Update count of how many of this recipe has been added to the shopping list
      document.getElementById(recipe.name +'Count').innerHTML = " " + recipe.numWanted + " ";

      // Shade this recipe so it is clear it has been selected
      if (recipe.numWanted > 0)
         document.getElementById(recipe.name).style.background = "lightgray";
      else
         document.getElementById(recipe.name).style.background = "white";
    }
  }
  DisplayShoppingList();
}

///////////////////////////////////////////////////////////////////////
function modifyRegularItemsInShoppingList(ingredientName)
{
  for (var i in RegularItemArray)
  {
    var ingredient = RegularItemArray[i];
    if (ingredient.nameInShop == ingredientName) 
    {
      if (document.getElementById(ingredientName).checked)
         theShoppingList.addSingleItem(ingredient);
      else
         theShoppingList.removeSingleItem(ingredient);
    }
  }
  DisplayShoppingList();
}

///////////////////////////////////////////////////////////////////////
function DisplayShoppingList()
{
  var recipeText = "";
  for (i in RecipeArray) {
    var recipe = RecipeArray[i];
    if (recipe.numWanted > 0)
      recipeText += "<li>" + recipe.name + " - Portions: " + (recipe.numWanted*recipe.numOfPortions) + " <i>(" + recipe.source + ")</i>";
  }

  theShoppingList.sort();

  var listText = "";
  for (category in CategoryArray.sort()) 
  {
      var categoryName = CategoryArray[category];
      var outPutCatTitle = 1;
      for (var i in theShoppingList.ingredientList)
      {
        var ingredient = theShoppingList.ingredientList[i];
        if (!ingredient.category)
        {
           listText += "<p>Error \"" + ingredient.nameInShop + "\" has not been put into a food category (e.g. Rice and Pasta, Dairy, etc)\n";
        } 
        if (ingredient.category == categoryName)
        {
           if (outPutCatTitle) 
           {
             listText += "<h4 class='category'>" + categoryName + "</h4>\n";
             outPutCatTitle = 0;
           }
           listText += "<tr><td>&nbsp;&nbsp;" + ingredient.nameInShop + "</td>";
           if (ingredient.amount) {
	       listText +=  "<td>" + ingredient.amount + ingredient.units + ingredient.unitConversionNote + "</td></tr>\n";
           } else
             listText +=  "<td>&nbsp;</td></tr>\n";
        }
      }
  }

  if (listText.length == 0) 
     document.getElementById("ShoppingList").innerHTML = "<h3>Shopping List</h3>\n<i>Empty</i>\n";
  else
     document.getElementById("ShoppingList").innerHTML = "<h3>Shopping List</h3>\n<ul>"+recipeText+"</ul>\n<p><table>"+listText+"</table>\n";
}

///////////////////////////////////////////////////////////////////////
// Parse the XML recipes and generate the page content and dynamic controls.
function parseXMLRecipeList()
{
  // Read the food categories (e.g. we can put apples in a "Fruit and Veg" category).
  var categoryList = xmlDoc.getElementsByTagName('category');
  var categories = new Object();
  for (i=0; i < categoryList.length; i++)
  {
    var categoryName = categoryList[i].getAttribute('name');
    CategoryArray.push(categoryName);
    for (j=0; j < categoryList[i].getElementsByTagName('item').length; j++)
    {
        var itemName = categoryList[i].getElementsByTagName('item')[j].childNodes[0].nodeValue;
        if (!categories[itemName])
          categories[itemName] = categoryName;
    }
  }

  // Generate a table of regular shopping items with checkboxes to allow the user to select them
  var regularItems = xmlDoc.getElementsByTagName('regularItem');
  var tblBody = document.createElement("tbody");
  for (i=0; i < regularItems.length; i++)
  {
    var itemName = regularItems[i].childNodes[0].nodeValue;

    // Store this ingredient in RegularItemArray.
    var newIngred = new SingleIngredient(itemName,itemName,1,"",categories[itemName]);
    RegularItemArray.push(newIngred);

    var row   = document.createElement("tr");
    var cell1 = document.createElement("td");
    var cell2 = document.createElement("td");

    var cell1Text = document.createTextNode(itemName+":");
    var cell2Obj  = document.createElement("INPUT");
    cell2Obj.setAttribute("type", "checkbox");
    cell2Obj.setAttribute("id", itemName);
    eventAdder(cell2Obj,"onclick","modifyRegularItemsInShoppingList('" + itemName + "')")

    cell1.appendChild(cell1Text);
    cell2.appendChild(cell2Obj);

    row.appendChild(cell1);
    row.appendChild(cell2);
    tblBody.appendChild(row);
  }
  var tbl = document.createElement("table");
  tbl.setAttribute("class", "noPrint");
  tbl.appendChild(tblBody);
  document.getElementById('RegularItems').appendChild(tbl);

  // Generate a list of recipies with "-" and "+" buttons for the use to add to their shopping list
  var recipes = xmlDoc.getElementsByTagName('recipe');
  for (i=0; i < recipes.length; i++)
  {
    var curRecipe = recipes[i];
    // Gather and store info about this recipe - then add it to RecipeArray.
    var recipeName     = curRecipe.getElementsByTagName('name')[0].childNodes[0].nodeValue;
    var recipePortions = curRecipe.getElementsByTagName('portions')[0].childNodes[0].nodeValue;
    var recipeSource   = curRecipe.getElementsByTagName('source')[0].childNodes[0].nodeValue;
    var thisRecipe = new SingleRecipe(recipeName,parseInt(recipePortions),recipeSource);

    // Non mandatory info
    if (curRecipe.getElementsByTagName('points').length > 0)
       thisRecipe.weightWatcherPoints = curRecipe.getElementsByTagName('points')[0].childNodes[0].nodeValue;
    if (curRecipe.getElementsByTagName('prepAndCookingTime').length > 0)
       thisRecipe.prepAndCookingTime = curRecipe.getElementsByTagName('prepAndCookingTime')[0].childNodes[0].nodeValue;

    for (j=0; j < curRecipe.getElementsByTagName('ingredient').length; j++)
    {
      if (curRecipe.getElementsByTagName('ingredient')[j].nodeName == "ingredient")
      {
         var ingredient = curRecipe.getElementsByTagName('ingredient')[j];
         var ingredientPrettyName = ingredient.childNodes[0].nodeValue;
         var ingredientnameInShop   = ingredient.getAttribute('nameInShops');
         if (!ingredientnameInShop) ingredientnameInShop = ingredientPrettyName;

         var ingredientAmount = ingredient.getAttribute('amount');
         if (!ingredientAmount) ingredientAmount = 1;

         var ingredientUnits = ingredient.getAttribute('units');
         if (!ingredientUnits) ingredientUnits = "";

         var ingredientCategory = categories[ingredientnameInShop];
         if (!ingredientCategory) ingredientCategory = "";
         
         var thisIngredient = new SingleIngredient(ingredientnameInShop,ingredientPrettyName,parseFloat(ingredientAmount),ingredientUnits,ingredientCategory);
         thisRecipe.ingredientList.push(thisIngredient);
      }
    }
    RecipeArray.push(thisRecipe);

    // Now generate HTML to display this recipe on the page

    var recipeDIV = document.createElement('DIV');
    recipeDIV.setAttribute("class", "recipe");
    recipeDIV.setAttribute("id", thisRecipe.name);

    var dropDown = document.createElement("IMG");
    dropDown.setAttribute("src", "Images/dropDown.jpg");
    dropDown.setAttribute("alt", " -/+");
    eventAdder(dropDown,"onclick","showHide('" + thisRecipe.name + " Info')")

    //Output recipe Title
    var recipeTitle = document.createElement("h4");
    recipeTitle.innerHTML = thisRecipe.name;
    recipeTitle.appendChild(dropDown);
    recipeDIV.appendChild(recipeTitle);

    var infoDIV = document.createElement('DIV');
    infoDIV.setAttribute("style", "display:none;");
    infoDIV.setAttribute("id", thisRecipe.name + " Info");

    infoDIV.appendChild(document.createTextNode("Recipe Source: " + thisRecipe.source));
    infoDIV.appendChild(document.createElement('BR'));

    infoDIV.appendChild(document.createTextNode("Portions: " + thisRecipe.numOfPortions));
    infoDIV.appendChild(document.createElement('BR'))

    if (thisRecipe.weightWatcherPoints > 0) {
      infoDIV.appendChild(document.createTextNode("Weight Watchers Points: " + thisRecipe.weightWatcherPoints));
      infoDIV.appendChild(document.createElement('BR'))
    }
    if (thisRecipe.prepAndCookingTime.length > 0) {
      infoDIV.appendChild(document.createTextNode("Preparation and Cooking Time: " + thisRecipe.prepAndCookingTime));
      infoDIV.appendChild(document.createElement('BR'))
    }

    infoDIV.appendChild(document.createElement('P'));
    infoDIV.appendChild(document.createTextNode("Ingredients List:"));

    var ulElement = document.createElement("UL");
    for (var curIng in thisRecipe.ingredientList) 
    {
       var iname     = document.createTextNode(thisRecipe.ingredientList[curIng].amount + thisRecipe.ingredientList[curIng].units + " " + thisRecipe.ingredientList[curIng].prettyName);
       var liElement = document.createElement("LI");
       liElement.appendChild(iname);
       ulElement.appendChild(liElement);
    }
    infoDIV.appendChild(ulElement);
    recipeDIV.appendChild(infoDIV);

    //Output recipe list controls ("-" and "+" buttons)
    var cdata = document.createTextNode("Meals Wanted: ");
    recipeDIV.appendChild(cdata);

    var minusButton = document.createElement("IMG");
    minusButton.setAttribute("src", "Images/minus.gif");
    minusButton.setAttribute("alt", " -");
    eventAdder(minusButton,"onclick","modifyRecipiesInShoppingList('" + thisRecipe.name + "','-')")
    recipeDIV.appendChild(minusButton);

    var counterSpan = document.createElement("span");
    counterSpan.setAttribute("id",thisRecipe.name + "Count");
    counterSpan.innerHTML = " 0 ";
    recipeDIV.appendChild(counterSpan);

    var plusButton = document.createElement("IMG");
    plusButton.setAttribute("src", "Images/plus.gif");
    plusButton.setAttribute("alt", " +");
    eventAdder(plusButton,"onclick","modifyRecipiesInShoppingList('" + thisRecipe.name + "','+')")
    recipeDIV.appendChild(plusButton);

    document.getElementById('RecipeList').appendChild(recipeDIV);
  }
}

///////////////////////////////////////////////////////////////////////
// When the page loads - read the XML document to get the recipe list
function load() 
{
   xmlDoc = document.implementation.createDocument("", "", null);
   xmlDoc.onload = parseXMLRecipeList;
   xmlDoc.load("XML/recipes.xml");

   DisplayShoppingList();
}

