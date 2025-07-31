import CategoryItem from "../components/CategoryItem.jsx";

const categories = [
    {href: "/kenyan-flag", name: "kenyan-flag", imageUrl: "/33.PNG"},
    {href: "/countries-flag", name: "countries-flag", imageUrl: "/161.PNG"},
    {href: "/friendship", name: "friendship", imageUrl: "/191.jpeg"},
    {href: "/key-holders", name: "key-holders", imageUrl: "/202.jpeg"},
    {href: "/personalized", name: "personalized", imageUrl: "/169.PNG"},
    {href: "/beaded-friendship", name: "beaded-friendship", imageUrl: "/174.jpg"},
    {href: "/couples", name: "couples", imageUrl: "/245.jpeg"},
    {href: "/bangles", name: "bangles", imageUrl: "/118.PNG"},
]
const HomePage = () => {
    return (
        <div className="relative min-h-screen text-white overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            
            <h1 className="text-5xl text-center sm:text-6xl font-bold text-emerald-400 mb-4">Explore Our Categories</h1>
            <p className="text-xl text-center text-gray-300 mb-12">Discover the latest trends. Made just for you.</p>
            <p className="text-sm text-center text-blue-400 mb-12">LOCATED IN <b>DeKUT, NYERI</b> </p>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                   <CategoryItem 
                    category={category}
                    key={category.name}
                    />
                ))}
            </div>
        </div>    
    </div>
    );
};
export default HomePage;
