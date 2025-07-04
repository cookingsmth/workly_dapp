// utils/releasePayment.js
export async function releasePayment(taskId, workerId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ workerId })
    })

    const result = await response.json()
    
    if (response.ok) {
      showWorklyToast(`✅ Payment sent! TX: ${result.txHash}`)
      window.location.reload()
    } else {
      showWorklyToast(`Error: ${result.error}`)
    }
  } catch (error) {
    showWorklyToast('Failed to send payment')
    console.error(error)
  }
}