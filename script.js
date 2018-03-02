//Namespace
var App = {
		Collection: {},
		Model: {},
		View: {},
	};
	
//Model
App.Model.Item = Backbone.Model.extend({
	
	//utworzenie własności podstawowych
	defaults: {
		'price': 0.99,
		'quantity': 0,
		'total': 0
	},
	
	//pobranie zmiennej total, ustawienie jej jako "price" * "quantity" i zwrócenie tejże
	total: function() {
			var total = this.get('price') * this.get('quantity');
			this.set ('total', total);
			return total;
		},
	
	//zwiększanie i zmniejszanie zmiennej quantity
	quanity: function(type) {
		var qty = this.get('quantity');
		this.set('quantity', (type === 'increase' ? ++qty : --qty));
	}
	
});	


//zdefiniowanie kolekcji itemów
App.Collection.Items = Backbone.Collection.extend({
	
	models: App.Model.Item,
	
	//zwrócenie liczby itemów w zmiennej total
	subtotal : function() {
		
		var total = 0;

		this.each(function( model ){
			total += model.total();
		});

		return total.toFixed(2) + ' ' + currencySign;
	}
});

//View dla każdego itemu z listy 
App.View.Item = Backbone.View.extend({
	
	//itemy z listy będą się układać jako list item
	tagName: 'li',
	
	//umiejscowienie View w elemencie html o id "tmp-shoppingListItem"
	template: $('#tmp-shoppingListItem').html(),
	
	//Lista eventów
	events: {
		'click' : 'addToCart'
	},
	
	//renderowanie
	initialize: function() {
		this.render();
	},
	
	render: function() {
		this.$el.html(_.template(this.template, this.model.toJSON()));
		return this;
	},
	
	//"addToCart" wywoływane podczas kliknięcia
	addToCart : function() {
		//dodanie modelu do Cart view
		App.cart.add(this.model);
	}
	
	
});

//Utworzenie View dla listy osobnych itemów
App.View.ItemList = Backbone.View.extend({
	
	el: '#item-list',
	
	initialize: function() {
		this.render();
	},
	
	render: function() {
		
		//Pętla przez każdy item w kolekcji
		this.collection.each(function(item) {
			
			//Tworzenie nowego View dla itemu w tym modelu
			var itemView = new App.View.Item({model: item});
			
			//Dodanie nowego itemu do List View
			this.$el.append(itemView.render().el);
		},
		//Przekazanie List View - będzie go można używać później jako "$el"
		this);
	}
});

// Indywidualny View dla każdego itemu w "Shopping Cart"
App.View.ShoppingCartItemView = Backbone.View.extend({
	
	// Ustawienie elementu w tym View jako table row (tr)
	tagName: 'tr',
	template: $('#tmp-shoppingCartItem').html(),
	
	
	//Nadanie eventów
	// Każdy event to kliknięcie na odpowiedni element strony
	//Nadanie dla każdego z eventów odpowiedniej funkcji zdefiniowanej później w tym View
	events: {
		'click .name': 'remove',
		'click .quantity': 'manageQuantity'
	},
	
	initialize: function(){
		
		this.render();
		
		//Jeśli następuje zmiana w modelu, model jest ponownie renderowany
		this.model.on('change', function(){
			this.render();
		}, this);
	},
	
	render: function() {
		
		//Renderowanie tego view i zwrócenie jego zawartości
		this.$el.html( _.template( this.template, this.model.toJSON() ));
		return this;
	},
	
	//Event dla "click.quantity"
	manageQuantity: function(event) {
		
		//Pobranie typu targeta, który wywołuje event
		var type = $(event.target).data('type');
		
		//Jeśli dany event odwołuje się do typu "decrease", i jesli value quantity = 1
		//uruchamia funkcję "remove"
		if(this.model.get('quantity') === 1 && type === 'decrease' ) {
			this.remove();
		}else {
			//w przeciwnym wypadku zwiększenie lub zmniejszenie value quanity
			this.model.quanity(type);
		}
	},
	
	remove: function(){
		
		//Zanikanie itemu z shoppingCartList
		//500 - czas zanikania
		this.$el.fadeOut(500, function(){
			$(this).remove();
		});
		
		App.cartItems.remove( this.model );
	}
	
});


//View dla Shopping Carta
//Pojemnik na poszczególne Item Views dla shopping carta
App.View.ShoppingCart = Backbone.View.extend({
	
	el: '#shopping-list',
	
	
	total: $('#total'),
	basketTotal: $('#basket'),
	
	initialize: function() {
		
		//odwołanie do kolekcji "cartItems"
		this.collection = App.cartItems;
		
		//zainicjowanie funkcji "defaultMessage"
		this.defaultMessage();
		
		//Przy dodaniu, usunięciu lub zmianie quantity  zainicjuj funkcję
		//WAŻNE : PRZY "add remove change" NIE DOKLAJAĆ DWUKROPKA
		this.collection.on('add remove change :quantity', function(item) {
			
			//Zainicjowanie funkcji "updateTotal" zdefiniowanej poniżej
			this.updateTotal();
			
			//Jeśli w koszyku nie ma itemów
			if( this.collection.length === 0 ) {
				this.defaultMessage();
			}
		}, this);
	},
	
	defaultMessage: function() {
		
		//nadanie clasy "empty"
		this.$el.addClass('empty').html('<tr><td colspan="4">Cart is empty</td></tr>')
	},
	
	add: function(item) {
		
		//usunięcie klasy "empty"
		this.$el.removeClass('empty');
		
		//Zwiększenie quanity o 1
		item.quanity('increase');
		
		//Przekazanie itemu do kolekcji Cart
		this.collection.add(item);
		
		//Wyrenderowanie widoku
		this.render();
	},
	
	updateTotal: function() {
		
		//Licznik 
		var basketTotal = 0;
		
		//Zwiększenie licznika
		this.collection.each(function( item ){
			basketTotal += item.get('quantity');
		});
		
		//Wrzucenie do html wartości tych zmiennych
		this.basketTotal.html(basketTotal);
		this.total.html( this.collection.subtotal() );
	},
	
	render: function(){
		
		//Wyczyszczenie widoku
		this.$el.html('');
		
		this.collection.each(function( item ){
			
			//Wyrenderowanie każdego modelu item do List View
			var newItem = new App.View.ShoppingCartItemView({model:item});
			this.$el.append(newItem.render().el);
		}, this);
	}
	
});


	var currency = $('#currency').val();
	var costPro;
	var costAir;
	var costMacbook;
	var defultItems;
	var currencySign;

			
$("#currency").on('change', function(){
	if(this.value === 'dolar'){
		costPro = (2999.99 / 3.39); 
		costAir = (2779.99 / 3.39);
		costMacbook = (1999.9 / 3.39);
		currencySign = "$";
		

		}else if(this.value === 'zloty'){
		costPro = (2999.99 / 1); 
		costAir = (2779.99 / 1);
		costMacbook = (1999.9 / 1);
		currencySign = "Zł";
		
		}else if(this.value === 'euro'){
		costPro = (2999.99 / 4.17); 
		costAir = (2779.99 / 4.17);
		costMacbook = (1999.9 / 4.17);
		currencySign = "€";
		
		}else if(this.value === 'pound'){
		costPro = (2999.99 / 4.74); 
		costAir = (2779.99 / 4.74);
		costMacbook = (1999.9 / 4.74);
		currencySign = "£";
		}
		

	
	defaultItems =[
	{title: 'MacBook Pro', price: costPro },
	{title: 'MacBook Air', price: costAir },
	{title: 'MacBook', price: costMacbook },
	];
	
	App.items = new App.Collection.Items();
	App.cartItems = new App.Collection.Items();

	App.cartItems.on('add', function( item ){

	item.set('quantity',1);
	});


	for( var i in defaultItems ) {
	App.items.add( new App.Model.Item(defaultItems[i]) );
	}


	App.items = new App.Collection.Items();
	App.cartItems = new App.Collection.Items();

	App.cartItems.on('add', function( item ){

	item.set('quantity',1);
	});


	for( var i in defaultItems ) {
	App.items.add( new App.Model.Item(defaultItems[i]) );
	}


	App.cart = new App.View.ShoppingCart();
	

	$(function(){

		$('#total').html('0.00');
		$('#basket').html('0');
		$("#item-list").html('');
		App.itemList = new App.View.ItemList({ collection: App.items });
		
	});
	

});

/*$('.carousel').carousel({
  interval: 2000
}) */



	

				









































