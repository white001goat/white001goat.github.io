var webCarto = function() {
  core = {
    nav : navigator.geolocation,
    /*
    @property components array
     Ordinal array [field name, CSS class name for target, DOM Element for information target].
     The DOM Element begins at null and remains as such until it is set or found
     by the script.
     */
    components : [
      ['longitude','webGeo-long',null],
      ['latitude','webGeo-lat',null],
      ['accuracy','webGeo-accuracy',null],
      ['altitude','webGeo-altitude',null],
      ['altitudeAccuracy','webGeo-altAccuracy',null],
      ['heading','webGeo-heading',null],
      ['speed','webGeo-speed',null],
      ['timestamp','webGeo-time',null],
      ['error','webGeo-error',null]
    ],
        /* Looks for items with associated classes */
        initUI : function(){
            var ui = null;
            var nm = '';
            for (itm in this.components){
                nm = this.components[itm][0];
                ui = document.querySelector("." + this.components[itm][1]);
                this.components[itm][2] = ui;
            }
        },
        refreshUI : function(){
            var ui = null;
            var entry = this.lastEntry();
            var val = null;
            for (itm in this.components){
                ui = this.components[itm][2];
                prop = this.components[itm][0];
                val = this.getProp(entry, prop);
//TODO give value precedent over innerHTML
                if (ui != null){
                    //val = (prop == 'timestamp')?this.getTime(entry):val;
                    val = (prop == 'timestamp')?this.formatDate(entry.timestamp,''):val;
                    val = (val !== null && (prop == 'accuracy' || prop == 'altitudeAccuracy'))?this.formatMeters(val):val;
                    ui.innerHTML = (val)?val:"";
                }

            }
        },
        /*
        @property opts object
        Our preferred options when making a asynchronous call to the navigator.geolocation
        API's getCurrentPosition or watchPosition methods.
         */
        opts : {
            enableHighAccuracy: true, //default: false
            timeout: 10000, // default infinity
            maximumAge: 5000  // default 0ms.
        },
        /*
        @property coordStack array
        Storage of previously called locations.
        FIXME currently this has no clean-up function. Duplicate records and accessive local storage should be avoided.
         */
        coordStack : [],
        /*
        @method getMapImg
        Sets the source of image with id 'mapholder' to a static google map devoid
        of any Google Map API extras such as Markers. This method should work as a fallback
        should you not wish to load the entire google.map.api.
        @parameter lat number
        The numeric value of the latitudinal location.
        @parameter lon number
        The numeric value of the given longitudinal location
        @return string A string URI representing the path to requested gelocation's
        image file. In the case of Google, a path to a .PNG file is returned.
         */
        getMapImg : function(lat, lon){
            var mapholder = document.getElementById('mapholder');

            var img_url = "http://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lon + "&zoom=14&size=400x300&sensor=false";
            if (mapholder) mapholder.src = img_url;
            return img_url;
        },
        getMap : function(lat, lon){
            latlon = new google.maps.LatLng(lat, lon);
            mapholder = document.getElementById('mapholder');
//        mapholder.style.height = '250px';
//        mapholder.style.width = '500px';
            var myOptions = {
                center : latlon,
                zoom : 14,
                mapTypeId : google.maps.MapTypeId.ROADMAP,
                mapTypeControl : false,
                navigationControlOptions : {
                    style : google.maps.NavigationControlStyle.SMALL
                }
            }

            var map = new google.maps.Map(document.getElementById("mapholder"), myOptions);
            var marker = new google.maps.Marker({position:latlon,map:map,title:"You are here!"});
        },
        getNew : function(){
            var self = this;
            //this.nav.getCurrentPosition(self.addNew, self.addErr, this.opts);
            this.nav.getCurrentPosition(function(dat){
                    self.addNew(dat);
                },
                function(err){
                    self.addErr(err)
                },
                self.opts
            );
        },
        addNew : function(dat){
            dat.coords.timestamp = dat.timestamp;
            this.coordStack.push(dat.coords);
            this.initUI();

this.addErr('This is a total bogus error message just for the sake of testing. You should have your data soon.');
//        this.getMap(dat.coords.latitude, dat.coords.longitude);
            this.getMapImg(dat.coords.latitude, dat.coords.longitude);
            this.refreshUI();
        },
        addErr : function(err){
          var rpt = {
            err : null,
            timestamp : Math.round(new Date().getTime())
          };
          if (typeof(err) === 'string'){
            rpt.error = err;
            this.coordStack.push(rpt);
            return err;
          }
          var ret = "An error retrieving Geographical data.";
          switch(err.code) {
            case err.PERMISSION_DENIED:
              ret = "User denied the request for Geolocation.";
              break;
            case err.POSITION_UNAVAILABLE:
              ret = "Location information is unavailable.";
              break;
            case err.TIMEOUT:
              ret = "The request to get user location timed out.";
              break;
            case err.UNKNOWN_ERROR:
              ret = "An unknown error occurred.";
              break;
            }
          rpt.error = ret;
          this.coordStack.push(rpt);
          this.refreshUI();
          return ret;
        },
        getProp : function(entry, property){
            switch (typeof(entry)){
                case 'number':
                    entry = this.coordStack[entry];
                    break;
                case 'object':
                    break;
                default:
                    return null;
            }

            if(!entry.hasOwnProperty(property)) return null;
            return entry[property];
        },
        lastEntry : function(){
            if(!this.coordStack && this.coordStack.length > 0) return null;
            var i = this.coordStack.length - 1;
            return this.coordStack[i];
        },
        formatMeters : function(meters){
            var ret = '';
            var km = meters * 0.001;
            ret += (km >= 1)? km + ' kilometers' : meters + ' meters';
            var yards = meters * 1.09361;
            yards = Math.round(yards * 100) / 100;
            var miles = meters * 0.000621371;
            miles = Math.round(miles * 100) / 100;
            ret += (miles >= 1)? ' ' + miles + ' miles':' ' + yards + ' yards';
            return ret;
        },
        formatDate: function(stamp, form){
            function fillTwo(part){
                return part.substr(part.length-2);
            };
            var a = new Date(stamp);
            //Buried until we can internationalize it
            //var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            //var month = months[a.getMonth()];
            var year = a.getFullYear();
            var month = a.getMonth() + 1;
            month = '0' + month;
            month = fillTwo(month);
            var day = '0' + a.getDate();
            day = fillTwo(day);
            var hour = '0' + a.getHours();
            var min = '0' + a.getMinutes();
            min = fillTwo(min);
            var sec = '0' + a.getSeconds();
            sec = fillTwo(sec);

            var date = '' + year + '-' + month + '-' + day;
            var time = '' + hour + ':' + min + ':' + sec ;
            switch (form){
                case 'time':
                    return time;
                    break;
                case 'date':
                    return date;
                    break;
                case 'iso':
                    return a.toISOString().match(/(\d{2}:\d{2}:\d{2})/);
                    break;
                default:
                    break;
            }
            return date + ' ' + time;
        },
        getLat : function(){
            var args = (arguments.length > 0)? arguments:this.lastEntry();
            return this.getProp(args, 'latitude');
        },
        getLon : function(){
            var args = (arguments.length > 0)? arguments:this.lastEntry();
            return this.getProp(args, 'longitude');
        },
        getDateFull: function(){
            var args = (arguments.length > 0)? arguments:this.lastEntry();
            var stamp = this.getProp(args, 'timestamp');
            return this.formatDate(stamp,'full');
        },
        getDate: function() {
            var args = (arguments.length > 0)? arguments:this.lastEntry();
            var stamp = this.getProp(args, 'timestamp');
            return this.formatDate(stamp,'date');
        },
        getTime: function() {
            var args = (arguments.length > 0)? arguments:this.lastEntry();
            var stamp = this.getProp(args, 'timestamp');
            return this.formatDate(stamp,'time');
        }
    };

    return core;
}();