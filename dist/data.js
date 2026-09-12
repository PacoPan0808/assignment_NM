const CATEGORIES = ['Running gear', 'Training apparel', 'Sport shirts', 'Sport pants', 'Accessories', 'Yoga essentials'];
const IMAGE = {shoe:'assets/shoe.jpg',shirt:'assets/shirt.jpg',shorts:'assets/shorts.jpg',leggings:'assets/leggings.jpg',mat:'assets/mat.jpg',bag:'assets/bag.jpg'};
const PRODUCTS = [
 ['stride-runner','Stride Runner','Running gear',128,'shoe','Black / Cloud','Responsive cushioning and a breathable knit upper for easy miles and everyday momentum.','7,8,9,10,11,12','Best seller'],
 ['pace-short','Pace 5” Running Short','Running gear',48,'shorts','Midnight','Lightweight stretch fabric, a supportive liner, and a secure pocket keep every run distraction-free.','XS,S,M,L,XL',''],
 ['tempo-tee','Tempo Performance Tee','Running gear',38,'shirt','Chalk','An airy, moisture-wicking essential built for your next personal best.','XS,S,M,L,XL',''],
 ['form-tee','Form Training Tee','Training apparel',42,'shirt','Stone','Soft, quick-drying fabric with a relaxed athletic fit and flat seams for all-day comfort.','XS,S,M,L,XL','New arrival'],
 ['power-short','Power Training Short','Training apparel',54,'shorts','Black','Four-way stretch and reinforced seams move with you through every rep.','XS,S,M,L,XL',''],
 ['studio-legging','Studio Training Legging','Training apparel',68,'leggings','Graphite','Supportive stretch fabric, a wide waistband, and a side pocket for studio-to-street days.','XS,S,M,L,XL',''],
 ['essential-tee','Everyday Sport Tee','Sport shirts',32,'shirt','White','A versatile cotton-blend tee with a soft hand feel and an easy, regular fit.','XS,S,M,L,XL,XXL',''],
 ['aero-tee','Aero Technical Tee','Sport shirts',46,'shirt','Mist','Ventilated performance fabric keeps you comfortable when the intensity rises.','XS,S,M,L,XL',''],
 ['recovery-tee','Recovery Relaxed Tee','Sport shirts',36,'shirt','Cloud','A roomy, soft jersey layer for warm-ups, cool-downs, and the time in between.','XS,S,M,L,XL',''],
 ['motion-pant','Motion Stretch Pant','Sport pants',78,'leggings','Black','A streamlined fit with flexible fabric, an adjustable waist, and everyday practicality.','XS,S,M,L,XL',''],
 ['session-short','Session Sport Short','Sport pants',44,'shorts','Graphite','An easy everyday short with breathable mesh pockets and an adjustable waistband.','XS,S,M,L,XL',''],
 ['flex-legging','Flex Performance Legging','Sport pants',72,'leggings','Midnight','Smooth compression and sweat-wicking comfort for movement without distractions.','XS,S,M,L,XL',''],
 ['transit-bag','Transit Gym Bag','Accessories',64,'bag','Black','A lightweight 25-liter carryall with a roomy main compartment and separate shoe storage.','One size',''],
 ['weekender-bag','Everyday Kit Bag','Accessories',48,'bag','Graphite','A compact 18-liter bag with durable handles and an easy-access front pocket.','One size',''],
 ['stretch-strap','Studio Carry Strap','Accessories',18,'mat','Plum','An adjustable woven strap for carrying your mat and supporting gentle stretching.','One size',''],
 ['ground-mat','Ground Yoga Mat','Yoga essentials',58,'mat','Plum','A grippy, cushioned 5 mm surface that brings stability to your daily practice. 72 × 24 inches.','One size','Best seller'],
 ['flow-legging','Flow High-Rise Legging','Yoga essentials',68,'leggings','Black','Buttery-soft, opaque stretch fabric with a supportive high-rise waist for every flow.','XS,S,M,L,XL',''],
 ['balance-mat','Balance Travel Mat','Yoga essentials',42,'mat','Plum','A lightweight 3 mm mat that rolls up easily for practice wherever you go. 68 × 24 inches.','One size','']
].map(([id,name,category,price,image,color,description,sizes,badge])=>({id,name,category,price,image:IMAGE[image],color,description,sizes:sizes.split(','),badge}));
const DEMO_USER = {username:'alexmorgan',firstName:'Alex',lastName:'Morgan',email:'alex.morgan@example.com',phone:'+1 202-555-0147',address:'123 Example Avenue',city:'Portland',state:'OR',zip:'97205',country:'United States'};

