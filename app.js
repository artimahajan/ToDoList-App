//jshint esversion:6

import express from "express";
import bodyParser from "body-parser";
import mongoose from 'mongoose';
import _ from "lodash";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-arati:Test123@cluster0.hgmngdx.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({name: "Welcome to your todo list!"});
const item2 = new Item({name: "Hit the + button to add the new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", async function(req, res) {
  const foundItems = await Item.find({});
  if(foundItems.length === 0){
    await Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }
});


app.get("/:customListName", async function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  
  var foundList = await List.findOne({name: customListName}).exec();

  if(!foundList) {
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    list.save();
    res.render("/" + customListName);
  } else {
    res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
  }

});

app.post("/", async function(req, res){

  const itemName= req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    var foundList = await List.findOne({name: listName}).exec();
    foundList.items.push(item);
    foundList.save();

    res.redirect("/" + listName);
  }
  
});

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    await Item.findByIdAndRemove(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
    res.redirect("/" + listName);
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
