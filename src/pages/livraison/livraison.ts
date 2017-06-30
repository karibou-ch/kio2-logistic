import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoaderService, User, UserService } from 'kng2-core';

/**
 * Generated class for the LivraisonPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-livraison',
  templateUrl: 'livraison.html',
})
export class LivraisonPage {

  isAuthenticated:boolean;
  isReady:boolean;
  user: User = new User();

  constructor(
    private loaderSrv: LoaderService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private userSrv:UserService
    ) {
  }

  // ionViewCanEnter() {
  //   return this.userSrv.currentUser.isAuthenticated();
  // }

  ionViewDidLoad() {
    // this.loaderSrv.ready().subscribe((loader) => {
    //   Object.assign(this.user, loader[1]);
    //   this.isReady=true;
    // })
    console.log('livraison loaded')
    
  }

  // findAllOrdersForShipping(){
  //   let date = new Date(this.date);
  //   let month = date.getMonth();
  //   this.results = this.orderSrv.findAllOrders({fulfillments:'fulfilled,partial', month:month+1});
  // }

}
