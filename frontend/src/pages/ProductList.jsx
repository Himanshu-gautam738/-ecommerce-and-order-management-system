import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";

function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [selectedBrand, setSelectedBrand] = useState("ALL");
    const [priceRange, setPriceRange] = useState([0, 999999]);

    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    useEffect(() => {
        fetch(`${BASEURL}/api/products/`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch products");
                }
                return response.json();
            })
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    const categories = ["ALL", ...new Set(products.map(p => p.category?.name).filter(Boolean))];

    // Extract brand from the first word of product name
    const extractBrand = (name) => {
        if (!name) return "";
        return name.split(" ")[0].toLowerCase();
    };

    // Filter products by selected category to show only relevant brands
    const productsByCategory = products.filter(product => 
        selectedCategory === "ALL" || product.category?.name === selectedCategory
    );
    const brands = ["ALL", ...new Set(productsByCategory.map(p => extractBrand(p.name)).filter(Boolean))];

    const handlePriceChange = (e, index) => {
        const newRange = [...priceRange];
        newRange[index] = Number(e.target.value);
        setPriceRange(newRange);
    };

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedCategory("ALL");
        setSelectedBrand("ALL");
        setPriceRange([0, 999999]);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || product.category?.name === selectedCategory;
        const matchesBrand = selectedBrand === "ALL" || extractBrand(product.name) === selectedBrand;
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });

    if (loading) {
        return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex justify-center items-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
                {/* Sidebar Filter */}
                <div className="w-full md:w-[220px] md:min-w-[220px] bg-gray-100 p-5 rounded-lg self-start sticky top-24 ml-0">
                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    {/* Category */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3">Category</h3>
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="category"
                                        value={cat}
                                        checked={selectedCategory === cat}
                                        onChange={() => {
                                            setSelectedCategory(cat);
                                            setSelectedBrand("ALL");
                                        }}
                                        className="text-pink-500 focus:ring-pink-500"
                                    />
                                    <span className="text-gray-700">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Brand */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3">Brand</h3>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-3">Price Range</h3>
                        <p className="text-sm text-gray-600 mb-2">Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</p>
                        <div className="flex items-center space-x-2 mb-4">
                            <input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => handlePriceChange(e, 0)}
                                className="w-1/2 p-2 border border-gray-200 rounded-md shadow-sm"
                            />
                            <span>-</span>
                            <input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => handlePriceChange(e, 1)}
                                className="w-1/2 p-2 border border-gray-200 rounded-md shadow-sm"
                            />
                        </div>
                        <input
                            type="range"
                            min="0" max="999999"
                            value={priceRange[1]}
                            onChange={(e) => handlePriceChange(e, 1)}
                            className="w-full accent-pink-500"
                        />
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={resetFilters}
                        className="w-full bg-pink-600 text-white py-2 rounded-md font-semibold hover:bg-pink-700 transition"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Products Grid */}
                <div className="w-full flex-1">
                    <div className="flex justify-end mb-4">
                        <select className="p-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
                            <option>Sort by price</option>
                            <option value="low-to-high">Low to High</option>
                            <option value="high-to-low">High to Low</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-gray-500">No products available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductList;