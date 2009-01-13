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

var xmlDoc; 

var CategoryArray    = new Array();          // List of Food Categories (e.g. baking, drinks, veg, etc)
var NoNeedToBuyItemArray = new Array();          // List of items that we don't need to shop for (e.g. water)
var RecipeArray      = new Array();          // List of Recipes
var RegularItemArray = new Array();          // List of generic regular items (e.g. milk, eggs, fruit)
var theShoppingList  = new ShoppingList();   // The shopping list

// =========================================================================
// ==========  C  L  A  S  S     D  E  F  I  N  I  T  I  O  N  S  ==========
// =========================================================================

///////////////////////////////////////////////////////////////////////
// Constructor of Class to define a recipe ingredient
function SingleIngredient(nameInShop,prettyName,initialAmount,initialUnits,category)
{
  // Data Members
  this.nameInShop      = nameInShop;
  this.prettyName      = prettyName;
  this.amount          = initialAmount;
  this.units           = initialUnits;
  this.category        = category;
  this.unitList        = new Array(); // assosiative array Unit->amount.


  if (initialUnits=="")
      initialUnits = "wholeItem";
  this.unitList[initialUnits]=initialAmount;

  // Define the Member functions:

  // Method of the SingleIngredient class to increase amount (coping with possibly different units)
  //  Unit types: wholeItem (e.g. 1 carrot), g, tsp, tbsp, ml, pinch, squirt, sprig.
  this.addTo = function(item)
  {
      if (this.nameInShops != item.nameInShops)
	  alert("Can't add together \"" + this.nameInShops + "\" with \""+item.nameInShops+"\".");

      if (item.units=="")
	  item.units = "wholeItem";

      if (undefined===this.unitList[item.units])
	  this.unitList[item.units] = item.amount;
      else
	  this.unitList[item.units] += item.amount;
  }
  // Method of the SingleIngredient class to reduce amount (coping with possibly different units)
  this.reduceFrom = function(item)
  {
      if (item.units=="")
	  item.units = "wholeItem";

      if (undefined===this.unitList[item.units])
	  alert("Can't remove - item not in array");
      else {
	  this.unitList[item.units] -= item.amount;
	  if (this.unitList[item.units] <= 0)
	     delete this.unitList[item.units];
      }
  }
  // Method of the SingleIngredient class to determine whether needed in shopping list
  this.isNeeded = function()
  {
      for (var itemNeedTest in this.unitList)
	  if (this.unitList[itemNeedTest] > 0)
	      return true;
      return false;
  }
}

///////////////////////////////////////////////////////////////////////
// Constructor for Class to define a entire recipe
function SingleRecipe(recipeName,numOfPortions,recipeSource)
{
  // Data Members
  this.name           = recipeName;
  this.numOfPortions  = numOfPortions
  this.source         = recipeSource;
  this.numWanted      = 0;
  this.ingredientList = new Array();
  this.weightWatcherPoints = -1;
  this.prepAndCookingTime = "";
}

///////////////////////////////////////////////////////////////////////
// Constructor for Class to define a Shopping List (i.e a list of ingredients and a method to add and remove them)
function ShoppingList()
{
  this.ingredientList = new Array();

  // Define the Member functions:

  // addSingleItem - Method of the ShoppingList class to add an item (Auto sum Identical Ingredients)
  this.addSingleItem = function(item)
  {
   // First see if the ingredient already exists in the list
   var targetIngredientIndex = -1;
   for (var addIngIndex in this.ingredientList)
       if (this.ingredientList[addIngIndex].nameInShop == item.nameInShop) 
	   targetIngredientIndex = addIngIndex;

   // If the ingredient already exists in the list, add to it, else create it.
   if (targetIngredientIndex >= 0) {
     this.ingredientList[targetIngredientIndex].addTo(item);
   } else {
     var newIngredient = new SingleIngredient(item.nameInShop,item.prettyName,item.amount,item.units,item.category);
     this.ingredientList.push(newIngredient);
   }
  }

  // addRecipe - Method of the ShoppingList class to add a Recipe
  this.addRecipe = function(recipe)
  {
      recipe.numWanted++;
      for (var j in recipe.ingredientList) 
         this.addSingleItem(recipe.ingredientList[j]);
  }

  // Method of the ShoppingList class to remove a Ingredient
  this.removeSingleItem = function(item)
  {
   for (var itemToReduce in this.ingredientList)
      if (this.ingredientList[itemToReduce].nameInShop == item.nameInShop)
      {
	  this.ingredientList[itemToReduce].reduceFrom(item);
	  if (!this.ingredientList[itemToReduce].isNeeded())
	      delete this.ingredientList[itemToReduce];
      }
  }

  // Method of the ShoppingList class to remove Recipies
  this.removeRecipe = function(recipe)
  {
      if (recipe.numWanted > 0)
      {
        recipe.numWanted--;
        for (var j in recipe.ingredientList) 
           this.removeSingleItem(recipe.ingredientList[j]);
      }
  }

  // Method of the ShoppingList class to sort the list alphabetically
  this.sort = function()
  {
   var ingredientKeys       = new Array();
   var sortedIngredientList = new Array();

   // Build an array of keys
   for (var i in this.ingredientList)
      ingredientKeys.push(this.ingredientList[i].nameInShop);

   // Sort the array of keys and then use it to re-create the array of ingredients.
   for (var ingKey in ingredientKeys.sort())
       for (var copyItem in this.ingredientList)
       if (ingredientKeys[ingKey] == this.ingredientList[copyItem].nameInShop)
          sortedIngredientList.push(this.ingredientList[copyItem]);

   this.ingredientList = sortedIngredientList;
  }
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
         document.getElementById(recipe.name).style.background = "#C0C0C0";
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
// Fill the "ShoppingList" DIV with a HTML table containing the current contents of the shopping list
function DisplayShoppingList()
{

  // Format the recipes in the shopping list
  var recipeText = "";
  for (var i in RecipeArray) {
    var recipe = RecipeArray[i];
    if (recipe.numWanted > 0)
      recipeText += "<li>" + recipe.name + " - Portions: " + (recipe.numWanted*recipe.numOfPortions) + " <i>(" + recipe.source + ")</i>";
  }

  theShoppingList.sort();

  // Format the items in the shopping list
  var listText = "";
  for (var category in CategoryArray.sort()) 
  {
      var categoryName = CategoryArray[category];
      var outPutCatTitle = 1;
      for (var i in theShoppingList.ingredientList)
      {
        var ingredient = theShoppingList.ingredientList[i];

	if (NoNeedToBuyItemArray[ingredient.nameInShop] == 1)
	    continue; // Skip displaying items that we don't need to buy

        if (!ingredient.category)
           listText += "<p>Error \"" + ingredient.nameInShop + "\" has not been put into a food category (e.g. Rice and Pasta, Dairy, etc)\n";

        if (ingredient.category == categoryName)
        {
           if (outPutCatTitle) 
           {
             listText += "<h4 class='category'>" + categoryName + "</h4>\n<table>";
             outPutCatTitle = 0;
           }

	   var amountText =  "";
	   for (var itemDisplay in ingredient.unitList) {
	       if (amountText != "")
		   amountText += " and ";
	       amountText += ingredient.unitList[itemDisplay];
	       if (itemDisplay != "wholeItem")
		   amountText += " " + itemDisplay;
	   }

           listText += "<tr><td>&nbsp;&nbsp;" + ingredient.nameInShop + "</td><td>"+ amountText +"</td></tr>\n";
        }
      }
      listText += "</table>\n";
  }

  if (listText.length == 0) 
     document.getElementById("ShoppingList").innerHTML = "<h3>Shopping List</h3>\n<i>Empty</i>\n";
  else
     document.getElementById("ShoppingList").innerHTML = "<h3>Shopping List</h3>\n<ul>"+recipeText+"</ul>\n<p>"+listText+"\n";
}

///////////////////////////////////////////////////////////////////////
// Parse the XML recipes and generate the page content and dynamic controls.
// Call whenever the page loads
function parseXMLRecipeList()
{
  // Read the food categories (e.g. we can put apples in a "Fruit and Veg" category).
  var categoryList = xmlDoc.getElementsByTagName('category');
  var categories = new Object();
  for (var i=0; i < categoryList.length; i++)
  {
    var categoryName = categoryList[i].getAttribute('name');
    CategoryArray.push(categoryName);
    for (var j=0; j < categoryList[i].getElementsByTagName('item').length; j++)
    {
	// Save the category of each item
        var itemName = categoryList[i].getElementsByTagName('item')[j].childNodes[0].nodeValue;
        if (!categories[itemName])
          categories[itemName] = categoryName;

	// Save a list of "no shop items" - e.g. water = 1, noodles = 0.
	var isNoNeedToBuyItem = categoryList[i].getElementsByTagName('item')[j].getAttribute('notInShops');
	NoNeedToBuyItemArray[itemName] = (isNoNeedToBuyItem) ? (1) : (0);
    }
  }

  // Generate a table of regular shopping items with checkboxes to allow the user to select them
  var regularItems = xmlDoc.getElementsByTagName('regularItem');
  var tblBody = document.createElement("tbody");
  for (var i=0; i < regularItems.length; i++)
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
  for (var i=0; i < recipes.length; i++)
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

    for (var j=0; j < curRecipe.getElementsByTagName('ingredient').length; j++)
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
    recipeDIV.setAttribute("className", "recipe"); // IE workaround. (Shouldn't be needed but it is!)
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
    infoDIV.style.cssText = "display:none";  // IE workaround. IE doesn't like infoDIV.setAttribute("style", "display:none;");
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
// Read the XML document to get the recipe list (Browser specific functionality)
function importXML(file) { 
    var moz = (typeof document.implementation != 'undefined') && (typeof document.implementation.createDocument != 'undefined'); 
    var ie  = (typeof window.ActiveXObject != 'undefined'); 

    if (moz) { 
	xmlDoc = document.implementation.createDocument("", "", null);
	xmlDoc.onload = parseXMLRecipeList; 
    } else if (ie) { 
	xmlDoc = new ActiveXObject("Microsoft.XMLDOM"); 
	xmlDoc.async = false; 

	xmlDoc.onreadystatechange = function () {
	    if (xmlDoc.readyState == 4) parseXMLRecipeList();
	};
    } else {
	alert('Sorry, your browser can\'t handle this Javascript XML orientated script');
	return;
    }

    xmlDoc.load(file); 
}

///////////////////////////////////////////////////////////////////////
// When the page loads - read the XML document to get the recipe list and display an initially empty list
function load() 
{
    importXML("XML/recipes.xml");
    DisplayShoppingList();
}