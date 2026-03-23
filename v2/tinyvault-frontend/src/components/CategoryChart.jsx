import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useMemo } from 'react'
import { getCategoryColor } from '../constants/categoryColors'

function CategoryChart({ subscriptions }) {
  const data = useMemo(() => {
    const categoryTotals = {}
    subscriptions.forEach((sub) => {
      // API currently provides estimated_monthly_amount in the response (based on SubscriptionDetail.jsx)
      // If not, we fall back to manual calculation
      const amount = sub.estimated_monthly_amount || (sub.billing_cycle === 'Yearly' ? sub.amount / 12 : sub.amount)
      categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + amount
    })
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Sort by highest spend
  }, [subscriptions])

  if (!data.length) return null

  return (
    <div className="panel chart-panel">
      <h3>Monthly Spend by Category</h3>
      <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default CategoryChart
