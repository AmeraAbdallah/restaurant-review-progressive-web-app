/**
 * Common database helper functions.
 */

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;
   return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // getFromRestaurantOS().then((restauranrts)=>{
    //   // console.log('promise resolvee',restauranrts);
    //   callback(null,restauranrts);
    // }).catch((error)=>{
    //   // console.log('promise reject',error);

      fetch(`${DBHelper.DATABASE_URL}/restaurants`).then((response) => {
        return response.json();
      }).then((json) => {
        addToRestaurantOS(json);
        callback(null,json);
        // console.log('fetched');
      }).catch((err) => {
        getFromRestaurantOS().then((restaurants)=>{
          callback(null,restaurants);
        }).catch((error)=>{
          callback(error, null);
        });
      });

    // });
  }
  /**
   * Fetch Reviews.
   */
  static fetchReviewsByRestId(id) {
    const promise = new Promise((resolve, reject)=>{
      fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`).then((response) => {
          console.log('fetched');
          return response.json();
      }).then((json) => {
          addToReviewsOS(json);
          resolve(json);
      }).catch((err) => {
          console.log(`Request failed. Reviews failed fetched .. ${err}`);
            getFromReviewsOS(id).then((reviews)=>{
                // console.log('promise hh resolvee',reviews);
                resolve(reviews);
            }).catch((error)=>{
                // console.log('promise  hh reject',error);
                reject(error);
            });
      });
    });
    return promise ;
  }
  /**
   * send review when offline
   */
  static sendReviewsWhenOnline(review){

    addToOffReviewsOS(review);
    window.addEventListener('online', (event)=>{
      console.log('online');
      getFromOffReviewsOS(review.restaurant_id).then((reviews)=>{
        reviews.map((review)=>{
          DBHelper.addReview(review);
        });
      }).catch((err)=>{
      });
      let elements = document.querySelectorAll('.offline');

      [].forEach.call(elements, function(element) {
        element.classList.remove('offline');
      });

      clearOffReviewsOS();
    });
  }
  /**
   * send review
   */
  static addReview(review) {
    // console.log(review + "dsf");
    
    if(!navigator.onLine){
      console.log('offline');
      DBHelper.sendReviewsWhenOnline(review);
      return;
    }
    let rev = {
      restaurant_id: review.restaurant_id ,
      name: review.name ,
      rating: review.rating ,
      comments: review.comments,
    };
    var url = 'http://localhost:1337/reviews/';
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(rev),
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then((json) => {
      // addToReviewsOS(json); 
      // console.log(json);
    })
    .catch(error => console.error('Error:', error));
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
    
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.id === 10){
      return (`/dist/img/10.jpg`);
    }
    return (`/dist/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */

  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  static handleFavouriteWheneOffline(isFav, restaurant) {
    window.addEventListener('online', (event)=>{
      DBHelper.handleFavourite(isFav, restaurant);
    });
  }
  static handleFavourite(isFav,restaurant) {

    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${isFav}`,{
      method: 'PUT'
    }).then((response) => {
      return response.json();
    }).then((json) => {
      updateFavoriteRestaurantOS(restaurant) ;
      console.log('test '+json).stringify();
    }).catch((err) => {
      const error = (`Request failed. Returned status of ${err}`);
      console.log(error);
    });
  }

}



