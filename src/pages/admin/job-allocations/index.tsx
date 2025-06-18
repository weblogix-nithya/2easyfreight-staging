import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const JobAllocationPage = dynamic(() => import('./jobAllocations'), {
  ssr: false
})

export default JobAllocationPage
