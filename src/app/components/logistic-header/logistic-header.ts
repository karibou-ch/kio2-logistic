import { Component, EventEmitter, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { LoaderService, Order, OrderService, User, UserService } from 'kng2-core';
import { NavController, ToastController } from '@ionic/angular';
import { Events } from '../../services/events/events';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';


/**
 * Generated class for the LogisticHeaderComponent component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'logistic-header',
  templateUrl: 'logistic-header.html'
})
export class LogisticHeaderComponent implements OnDestroy, OnInit {

  // Keep options in memory cross windows
  static defaultDate: Date;
  static filtersOrder: any;

  @Input() format = 'EEEE d MMM';
  @Input() title = '';
  @Input() month: number;
  @Input() year: number;

  @Input() currentShippingDate: Date;
  @Input() stock: boolean;
  @Input() vendor: boolean;
  // tslint:disable-next-line: no-input-rename
  @Input('orders') hideOrders = false;
  @Input('collect') hideCollect = false;

  // execute data fetcher function of parent component
  @Output() doInitOrders = new EventEmitter<[Order[], Date, Date[], string]>();

  // execute data fetcher function of parent component
  @Output() doSelectedOrders = new EventEmitter<[Order[], Date]>();

  user: User = new User();
  closedShippings: boolean;
  monthOrders: Map<number, Order[]> = new Map();
  pickerShippingDate: string;
  availableDates: Date[] = [];
  isReady;
  isNetworkReady = true;
  inAdvance: number;
  netSubs: Subscription;

  // not yet handled by producers
  OPEN = { payment: 'authorized' };

  // got by the producers (sub-group of OPEN)
  LOCKED = { fulfillments: 'fulfilled,partial' };

  constructor(
    public events: Events,
    private $loader: LoaderService,
    public $route: Router,
    // private $network: Network,
    private $order: OrderService,
    private toast: ToastController,
    private $user: UserService
  ) {
  }

  displayMsg(msg: string) {
    this.toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  ngOnDestroy() {
    //
    // FIXME IMPORTANT unsubscribe("refresh");
    // this.events.unsubscribe("refresh");
    if (this.netSubs) {
      this.netSubs.unsubscribe();
    }
  }

  ngOnInit() {
    // keep in touch!

    this.$user.subscribe(user => {
      Object.assign(this.user, user);
    });

    try {
      // this.netSubs = this.$network.onChange().subscribe(() => {
      //   this.isNetworkReady = (this.$network.type !== 'none');
      // });
    } catch (e) {
      console.log('----- $network service error', e.message);
    }

    this.$loader.ready().subscribe((loader) => {
      let pickerDate;
      this.currentShippingDate = LogisticHeaderComponent.defaultDate || this.currentShippingDate;

      LogisticHeaderComponent.filtersOrder = LogisticHeaderComponent.filtersOrder || this.OPEN;
      //
      // FIXME issue with stream ordering (test right fter a login)
      this.user = (this.user && this.user.id) ? this.user : loader[1];
      LogisticHeaderComponent.defaultDate = this.currentShippingDate = this.currentShippingDate || Order.currentShippingDay();


      //
      // initial picker date
      pickerDate = new Date(this.currentShippingDate);
      if (this.month) {
        pickerDate.setMonth((this.month) - 1);
      }
      if (this.year) {
        pickerDate.setYear(this.year);
      }

      this.pickerShippingDate = pickerDate.toISOString();
      this.currentShippingDate.setHours(0, 0, 0, 0);


      this.findAllOrdersForShipping();

      //
      // the case of hiding collect button
      if (!this.hideCollect && !this.user.isAdmin() && !this.user.hasRole('logistic')) {
        this.hideCollect = true;
      }
      //
      // case of orders button
      if (!this.hideOrders && !this.user.isAdmin()) {
        this.hideOrders = true;
      }
      this.isReady = true;
    });

    //
    // refresh
    this.events.subscribe('refresh', this.findAllOrdersForShipping.bind(this));

  }

  //
  // on toggle orders filter
  toggleShippingFilter() {
    if (LogisticHeaderComponent.filtersOrder.payment) {
      LogisticHeaderComponent.filtersOrder = this.LOCKED;
    } else {
      LogisticHeaderComponent.filtersOrder = this.OPEN;
    }
    this.findAllOrdersForShipping();
  }

  //
  // on selected date
  updateDateFromPicker() {
    this.currentShippingDate = new Date(this.pickerShippingDate);

    this.currentShippingDate.setHours(0, 0, 0, 0);
    this.currentShippingDate.setDate(2);
    this.pickerShippingDate = this.currentShippingDate.toISOString();

    LogisticHeaderComponent.defaultDate = this.currentShippingDate;
    this.findAllOrdersForShipping();
  }

  //
  // this header component provide data for all pages
  findAllOrdersForShipping() {

    let Orders;
    const params = {
      month: (new Date(this.currentShippingDate).getMonth()) + 1,
      year: new Date(this.currentShippingDate).getFullYear(),
      padding: true
    };
    Object.assign(params, LogisticHeaderComponent.filtersOrder);
    this.monthOrders = new Map();
    this.availableDates = [];

    //
    // check orders source
    if (this.user.shops.length) {
      Orders = this.$order.findOrdersByShop(null, params);
    } else {
      Orders = this.$order.findAllOrders(params);
    }

    Orders.subscribe(orders => {
      orders.forEach((order: Order) => {
        order.shipping.when = new Date(order.shipping.when);
        order.shipping.when.setHours(0, 0, 0, 0);
        if (!this.monthOrders.get(order.shipping.when.getTime())) {
          this.monthOrders.set(order.shipping.when.getTime(), []);
          this.availableDates.push(order.shipping.when);
        }
        this.monthOrders.get(order.shipping.when.getTime()).push(order);
      });

      // FIXME, when currentDay is empty (orders == 0) then keys().next().value is wrong
      let closestValue = 9000000000000;
      this.monthOrders.forEach((orders, time) => {
        closestValue = Math.min(closestValue, time);
      });

      //
      // set currentshipping with first key
      const shipping = (this.monthOrders.get(this.currentShippingDate.getTime())) ?
        this.currentShippingDate : (new Date(closestValue));
      this.initOrders(shipping);
    }, error => {
      // Cette fonctionalité est réservée à la logistique
      this.displayMsg(error.error);
    });
  }

  getCurrentTime() {
    return this.currentShippingDate.getTime();
  }

  initOrders(shipping?) {
    LogisticHeaderComponent.defaultDate = shipping || LogisticHeaderComponent.defaultDate;
    const current = Order.currentShippingDay();
    if (!shipping) {
      return this.doInitOrders.emit([[], this.currentShippingDate, this.availableDates, this.pickerShippingDate]);
    }
    this.currentShippingDate = new Date(shipping);
    this.currentShippingDate.setHours(0, 0, 0, 0);
    if (this.currentShippingDate > current) {

    }

    this.doInitOrders.emit([this.monthOrders.get(this.currentShippingDate.getTime()), this.currentShippingDate, this.availableDates, this.pickerShippingDate]);
  }


  openOrdered() {
    const orders: Order[] = (this.monthOrders.get(this.currentShippingDate.getTime()));
    this.$route.navigateByUrl('/overview');
    // .push('OverviewPage', {
    //   orders: orders
    // });
  }


  openCollect() {
    this.$route.navigateByUrl('/collect');
    // this.$route.push('CollectPage', {
    //   shipping: this.currentShippingDate
    // });
  }

  openOrders() {
    this.$route.navigateByUrl('/customer');
    // this.$route.push('OrderCustomersPage');
  }

  openStock() {
    this.$route.navigateByUrl('/products');
    // this.$route.push('ProductsPage', {
    //   user: this.user
    // });
  }

  openVendor() {
    this.$route.navigateByUrl('/vendors');
    // this.$route.push('VendorPage', {
    //   user: this.user
    // });
  }

  //
  // fire event to display Map
  openMap() {
    // let orders = this.monthOrders.get(this.currentShippingDate.getTime());
    // this.doSelectedOrders.emit([orders, this.currentShippingDate]);
    this.$route.navigateByUrl('/map');
  }

  //
  // http://ionicframework.com/docs/components/#popovers
  openSettings(event) {
    this.$route.navigateByUrl('/admin');
    // this.navCtrl.push('AdminSettingsPage', {
    //   shipping: this.availableDates,
    //   current: this.currentShippingDate,
    //   toggle: (LogisticHeaderComponent.filtersOrder.payment && true),
    //   component: this,
    //   user: this.user
    // })
    // let popover = this.popoverCtrl.create(LogisticSettingsComponent);
    // popover.present();
  }
}

