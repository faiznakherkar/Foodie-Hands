import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FoodItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash, Plus } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { User } from '@/types';

const DonateFoodForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: '1', name: '', quantity: 0, unit: 'kg' }
  ]);
  const [ngos, setNGOs] = useState<User[]>([]);
  const [selectedNGO, setSelectedNGO] = useState<string>('');
  const [totalValue, setTotalValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingNGOs, setIsLoadingNGOs] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchNGOs = async () => {
      if (!user) return;

      try {
        setIsLoadingNGOs(true);
        const db = getFirestore();
        const usersRef = collection(db, 'users');
        
        // Query for all users with role 'ngo'
        const q = query(usersRef, where('role', '==', 'ngo'));
        
        // Get initial data
        const querySnapshot = await getDocs(q);
        const ngoList: User[] = [];
        
        querySnapshot.forEach((doc) => {
          const ngoData = doc.data() as User;
          ngoList.push({
            id: doc.id,
            ...ngoData,
          });
        });

        // Set initial data
        setNGOs(ngoList);

        // Set up real-time listener for updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const updatedNGOs: User[] = [];
          snapshot.forEach((doc) => {
            const ngoData = doc.data() as User;
            updatedNGOs.push({
              id: doc.id,
              ...ngoData,
            });
          });
          setNGOs(updatedNGOs);
        }, (error) => {
          console.error('Error in NGO listener:', error);
          toast.error('Error updating NGO list');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching NGOs:', error);
        toast.error('Failed to load NGOs');
      } finally {
        setIsLoadingNGOs(false);
      }
    };

    fetchNGOs();
  }, [user]);
  
  // Calculate total quantity
  const totalQuantity = foodItems.reduce(
    (sum, item) => sum + (item.unit === 'kg' ? item.quantity : item.quantity / 1000), 
    0
  );
  
  const handleAddFoodItem = () => {
    setFoodItems([
      ...foodItems,
      { id: Date.now().toString(), name: '', quantity: 0, unit: 'kg' }
    ]);
  };
  
  const handleRemoveFoodItem = (id: string) => {
    if (foodItems.length > 1) {
      setFoodItems(foodItems.filter(item => item.id !== id));
    }
  };
  
  const handleFoodItemChange = (id: string, field: keyof FoodItem, value: any) => {
    setFoodItems(foodItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedNGO) {
      toast.error('Please select an NGO');
      return;
    }
    
    if (foodItems.some(item => !item.name || !item.quantity)) {
      toast.error('Please fill in all food item details');
      return;
    }
    
    if (totalValue <= 0) {
      toast.error('Please enter a valid total value');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real app, this would call your API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Donation request sent successfully!');
      navigate('/restaurant/history');
    } catch (error) {
      toast.error('Failed to submit donation. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Donate Food</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Items</CardTitle>
              <CardDescription>List the food items you want to donate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {foodItems.map((item, index) => (
                <div key={item.id} className="flex flex-wrap md:flex-nowrap gap-3 items-end">
                  <div className="w-full md:w-1/2">
                    <Label htmlFor={`name-${item.id}`}>Food Item {index + 1}</Label>
                    <Input
                      id={`name-${item.id}`}
                      placeholder="e.g., Bread, Rice, Vegetables"
                      value={item.name}
                      onChange={(e) => handleFoodItemChange(item.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div className="w-full md:w-1/4">
                    <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => handleFoodItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="w-full md:w-1/4">
                    <Label htmlFor={`unit-${item.id}`}>Unit</Label>
                    <Select 
                      value={item.unit} 
                      onValueChange={(value) => handleFoodItemChange(item.id, 'unit', value)}
                    >
                      <SelectTrigger id={`unit-${item.id}`}>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="liter">Liters</SelectItem>
                        <SelectItem value="items">Items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveFoodItem(item.id)}
                    disabled={foodItems.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddFoodItem}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Items
              </Button>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Quantity:</span>
                  <span className="font-semibold">{totalQuantity.toFixed(2)} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Donation Details</CardTitle>
              <CardDescription>Provide additional information about your donation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="value">Estimated Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalValue}
                  onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 50.00"
                />
              </div>
              
              <div>
                <Label htmlFor="ngo">Select NGO</Label>
                {isLoadingNGOs ? (
                  <div className="w-full p-2 border rounded-md bg-gray-50">
                    Loading NGOs...
                  </div>
                ) : ngos.length === 0 ? (
                  <div className="w-full p-2 border rounded-md bg-gray-50">
                    No NGOs registered yet
                  </div>
                ) : (
                  <select
                    id="ngo"
                    value={selectedNGO}
                    onChange={(e) => setSelectedNGO(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select an NGO</option>
                    {ngos.map((ngo) => (
                      <option key={ngo.id} value={ngo.id}>
                        {ngo.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/restaurant/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Donation'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default DonateFoodForm;
