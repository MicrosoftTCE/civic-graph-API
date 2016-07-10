/**
 * Created by brianavecchione on 6/27/16.
 */

(function (angular) {

    'use strict';

    var locationServiceDependencies = [LocationService];



    function LocationService(){

        function isDef(o) {
            return o !== undefined && o !== null;
        }

        function Location(obj) {
            var defObj = isDef(obj) ? obj : {};
            var self = this;
            this.address_line = (isDef(defObj.address_line) ? defObj.address_line : null);
            this.locality = (isDef(defObj.locality) ? defObj.locality : null);
            this.district = (isDef(defObj.district) ? defObj.district : null);
            this.postal_code = (isDef(defObj.postal_code) ? defObj.postal_code : null);
            this.country = (isDef(defObj.country) ? defObj.country : null);
            this.country_code = (isDef(defObj.country_code) ? defObj.country_code : null);
            this.coordinates = (isDef(defObj.coordinates) ? defObj.coordinates : null);
            this.address_line = (isDef(defObj.address_line) ? defObj.address_line : null);

            this.getFullAddress = function() {
                return self.locality
                    ? self.district
                        ? self.locality + ', ' + self.district
                        : self.locality
                    : self.country;
            };
            this.formattedAddress = this.getFullAddress();

            this.getPartialAddress = function() {
                return self.locality.concat(self.country);
            };

        }

        this.getLocationModel = function(obj) {
            return new Location(obj);
        };

    }



    angular.module('civic-graph')
        .service('locationService', locationServiceDependencies);

})(angular);