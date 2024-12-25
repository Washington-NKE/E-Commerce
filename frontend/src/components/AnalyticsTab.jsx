import { motion } from "framer-motion";

const AnalyticsTab = () => {
  return (
    <div>
      
    </div>
  )
}

export default AnalyticsTab;

const AnalyticsCard = ({title, value, icon, color}) => (
  <motion.div
  className = {`relative rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-lg overflow-hidden ${color}`} 
  initial={{opacity: 0, y: 20}}
  animate={{opacity: 1, y: 0}}
  transition={{duration: 0.5}}
  >

<div className="flex justify-between items-center">
  <div className="z-10">
    <p className="text-sm font-medium text-gray-400">{title}</p>
    <h3 className="text-2xl font-semibold text-white">{value}</h3>
  </div>
</div>

    <div className="flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </div>
    </div>
  </motion.div> 
)
