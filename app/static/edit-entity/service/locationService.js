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
            this.address_line = (isDef(defObj.address_line) ? defObj.address_line : null);
            this.locality = (isDef(defObj.locality) ? defObj.locality : null);
            this.district = (isDef(defObj.district) ? defObj.district : null);
            this.postal_code = (isDef(defObj.postal_code) ? defObj.postal_code : null);
            this.country = (isDef(defObj.country) ? defObj.country : null);
            this.country_code = (isDef(defObj.country_code) ? defObj.country_code : null);
            this.coordinates = (isDef(defObj.coordinates) ? defObj.coordinates : null);
            this.id = (isDef(defObj.id) ? defObj.id : null);
            this.formattedAddress = (isDef(this.address_line) ? this.address_line +  ' ' : '')
                + (isDef(this.locality) ? this.locality + ', ' : '')
                + (isDef(this.country_code) ? this.country_code + ' ' : '')
                + (isDef(this.postal_code) ? this.postal_code : '');
            this.formattedAddress = this.formattedAddress.trim();
        }

        this.getLocationModel = function(obj) {
            return new Location(obj);
        };

    }



    angular.module('civic-graph')
        .service('locationService', locationServiceDependencies);

})(angular);