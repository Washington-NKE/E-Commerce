import ProductCard from "./ProductCard";
import { useState, useEffect } from "react";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const PeopleAlsoBought = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("/products/recommendations");
        console.log("Res data:", res.data);
        setRecommendations(res.data);
      } catch (error) {
        toast.error(error.response.data.message || "An error occurred while fetching recommendations");
      } finally{
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  },[]);

  if(isLoading) return <LoadingSpinner />

  return (
    <div className="mt-8">
      <h1 className="text-2xl font-semibold text-emerald-400">
        People also bought
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-4  sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default PeopleAlsoBought
