import React from 'react'

import { useNavigate } from 'react-router-dom'
import { LoanTable } from '@/components/loan-table'
import { useAuth } from '../context/AuthContext'

export default function Loans() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Loan Management</h1>
      <LoanTable />
    </div>
  )
} 