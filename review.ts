
export class UserModel {
    public id: string;
    public name: string;
    public cartId: string;
    
    constructor(response) {
      const { id, name, cart_id: cartId } = response.data;
      this.id = id;
      this.name = name;
      this.cartId = cartId;
    }
  }
  
  export class CartModel {
    public id: string;
    public name: string;
    
    constructor(item) {
      const { id, name } = item;
      this.id = id;
      this.name = name;
    }
  }
  
  export interface UserResponse {
    data: { id: string, name: string, cart_id: string };
    error: Error;
  }
  
  export interface CartResponse {
    data: { id: string, name: string }[];
    error: Error;
  }
  
  @Injectable({ providedIn: 'root' })
  export class UserService {
    source = new BehaviorSubject(null);
  
    data = this.source.asObservable();
    
    private cartData = [];
  
    constructor(private http: HttpClient) {}
    
    public requestUserData(userId: string): void {
      this.http
        .get(`http://api-url.com/v2/user/${userId}`)
        .subscribe((userRes: UserResponse) => {
          this.http
            .get(`http://api-url.com/v2/cart/${userRes.data.cartId}`)
            .subscribe((cartRes: CartResponse) => {
              this.cartData = cartRes.data;
              this.source.next({
                user: new UserModel(userRes),
                cart: cartRes.data.map(item => new CartModel(item)),
              });
            });
        });
    }
  
    public removeItemFromUserCart(userId, itemId): Observable<any> {
      return this.http.delete(`http://api-url.com/v2/user/${userId}/cart/${itemId}`)
    }
    
    public filterCartItems(filterTerm) {
      this.source.next({
        cart: this.cartData.filter(item => item.name.startsWith(filterTerm))
      })
    }
  }
  
  @Component({
    selector: 'app-usercart',
    template: `
      <section>
        <h1>{{ user?.name }}</h1>
        <p>User's cart:</p>
        <input #input
               (keydown)="filterItems(input.value)"
               placeholder="Filter cart items"/>
        <ul>
          <li *ngFor="let item of cart">
            <a [routerLink]="'/product/' + item.id">{{ item.name }}</a>
            <button (click)="remove(item.id)">Remove From Cart</button>
          </li>
        </ul>
      </section>
    `,
  })
  export class UserCartComponent implements OnChanges {
    @Input() userId: string;
    public user: UserModel;
    public cart: CartModel[];
  
    constructor(
      private userService: UserService,
    ) {
      this.userService.data.subscribe((data) => {
        this.user = data.user;
        this.cart = data.cart;
      });
    }
    
    ngOnChanges() {
      this.userService.requestUserData(this.userId);
    }
    
    filterItems(filterTerm) {
      this.userService.filterCartItems(filterTerm);
    }
  
    remove(itemId) {
      this.userService
        .removeItemFromUserCart(this.user.id, itemId)
        .subscribe(() => {
          const itemIndex = this.cart.findIndex((item) => item.id === itemId);
          this.cart.splice(itemIndex, 1);
        });
    }
  }