import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";

export function AdminPricingEditor() {
  const utils = trpc.useUtils();
  
  // State for selected service
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  
  // Fetch services
  const { data: services } = trpc.services.list.useQuery();
  
  // Fetch pricing data for selected service
  const { data: pricingData } = trpc.pricing.getServicePricing.useQuery(
    { serviceId: selectedServiceId! },
    { enabled: !!selectedServiceId }
  );
  
  // Fetch add-ons
  const { data: addOns } = trpc.pricing.getAddOns.useQuery();
  
  // Fetch package discounts
  const { data: packageDiscounts } = trpc.pricing.getPackageDiscounts.useQuery(
    { serviceId: selectedServiceId! },
    { enabled: !!selectedServiceId }
  );
  
  // Fetch special offers
  const { data: specialOffers } = trpc.pricing.getSpecialOffers.useQuery();
  
  // Dialog states
  const [bedroomDialog, setBedroomDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [sqmDialog, setSqmDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [itemDialog, setItemDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [addOnDialog, setAddOnDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [discountDialog, setDiscountDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [offerDialog, setOfferDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: number | null }>({ open: false, type: '', id: null });
  
  // Mutations
  const createBedroomTier = trpc.pricing.createBedroomTier.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setBedroomDialog({ open: false, mode: 'add' });
    },
  });
  
  const updateBedroomTier = trpc.pricing.updateBedroomTier.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setBedroomDialog({ open: false, mode: 'add' });
    },
  });
  
  const deleteBedroomTier = trpc.pricing.deleteBedroomTier.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setDeleteDialog({ open: false, type: '', id: null });
    },
  });
  
  const createSqmPricing = trpc.pricing.createSqmPricing.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setSqmDialog({ open: false, mode: 'add' });
    },
  });
  
  const updateSqmPricing = trpc.pricing.updateSqmPricing.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setSqmDialog({ open: false, mode: 'add' });
    },
  });
  
  const deleteSqmPricing = trpc.pricing.deleteSqmPricing.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setDeleteDialog({ open: false, type: '', id: null });
    },
  });
  
  const createUpholsteryItem = trpc.pricing.createUpholsteryItem.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setItemDialog({ open: false, mode: 'add' });
    },
  });
  
  const updateUpholsteryItem = trpc.pricing.updateUpholsteryItem.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setItemDialog({ open: false, mode: 'add' });
    },
  });
  
  const deleteUpholsteryItem = trpc.pricing.deleteUpholsteryItem.useMutation({
    onSuccess: () => {
      utils.pricing.getServicePricing.invalidate();
      setDeleteDialog({ open: false, type: '', id: null });
    },
  });
  
  const createPackageDiscount = trpc.pricing.createPackageDiscount.useMutation({
    onSuccess: () => {
      utils.pricing.getPackageDiscounts.invalidate();
      setDiscountDialog({ open: false, mode: 'add' });
    },
  });
  
  const updatePackageDiscount = trpc.pricing.updatePackageDiscount.useMutation({
    onSuccess: () => {
      utils.pricing.getPackageDiscounts.invalidate();
      setDiscountDialog({ open: false, mode: 'add' });
    },
  });
  
  const deletePackageDiscount = trpc.pricing.deletePackageDiscount.useMutation({
    onSuccess: () => {
      utils.pricing.getPackageDiscounts.invalidate();
      setDeleteDialog({ open: false, type: '', id: null });
    },
  });
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (!deleteDialog.id) return;
    
    switch (deleteDialog.type) {
      case 'bedroom':
        deleteBedroomTier.mutate({ id: deleteDialog.id });
        break;
      case 'sqm':
        deleteSqmPricing.mutate({ id: deleteDialog.id });
        break;
      case 'item':
        deleteUpholsteryItem.mutate({ id: deleteDialog.id });
        break;
      case 'discount':
        deletePackageDiscount.mutate({ id: deleteDialog.id });
        break;
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">Manage all pricing records for your services</p>
        </div>
        
        {/* Service Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Service</CardTitle>
            <CardDescription>Choose a service to manage its pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedServiceId?.toString()}
              onValueChange={(value) => setSelectedServiceId(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {selectedServiceId && pricingData && (
          <Tabs defaultValue="bedroom" className="space-y-4">
            <TabsList>
              <TabsTrigger value="bedroom">Bedroom Tiers</TabsTrigger>
              <TabsTrigger value="sqm">Square Meter</TabsTrigger>
              <TabsTrigger value="items">Upholstery Items</TabsTrigger>
              <TabsTrigger value="discounts">Package Discounts</TabsTrigger>
            </TabsList>
            
            {/* Bedroom Tiers Tab */}
            <TabsContent value="bedroom">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Bedroom-Based Pricing</CardTitle>
                    <CardDescription>Manage pricing tiers based on number of bedrooms</CardDescription>
                  </div>
                  <Button onClick={() => setBedroomDialog({ open: true, mode: 'add' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tier
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bedrooms</TableHead>
                        <TableHead>Price (EGP)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingData.pricing.tiers?.map((tier: any) => (
                        <TableRow key={tier.id}>
                          <TableCell>{tier.bedrooms} BR</TableCell>
                          <TableCell>{(tier.price / 100).toFixed(2)} EGP</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBedroomDialog({ open: true, mode: 'edit', data: tier })}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, type: 'bedroom', id: tier.id })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Square Meter Tab */}
            <TabsContent value="sqm">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Square Meter Pricing</CardTitle>
                    <CardDescription>Manage pricing based on square meters</CardDescription>
                  </div>
                  <Button onClick={() => setSqmDialog({ open: true, mode: 'add' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pricing
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>Price per sqm (EGP)</TableHead>
                        <TableHead>Minimum Charge (EGP)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingData.pricing.sqmPricing?.map((pricing: any) => (
                        <TableRow key={pricing.id}>
                          <TableCell>{pricing.variant || 'Standard'}</TableCell>
                          <TableCell>{(pricing.pricePerSqm / 100).toFixed(2)} EGP</TableCell>
                          <TableCell>{(pricing.minimumCharge / 100).toFixed(2)} EGP</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSqmDialog({ open: true, mode: 'edit', data: pricing })}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, type: 'sqm', id: pricing.id })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Upholstery Items Tab */}
            <TabsContent value="items">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Upholstery Items</CardTitle>
                    <CardDescription>Manage pricing for individual upholstery items</CardDescription>
                  </div>
                  <Button onClick={() => setItemDialog({ open: true, mode: 'add' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name (AR)</TableHead>
                        <TableHead>Item Name (EN)</TableHead>
                        <TableHead>Price (EGP)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingData.pricing.items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.itemNameEn}</TableCell>
                          <TableCell>{(item.price / 100).toFixed(2)} EGP</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemDialog({ open: true, mode: 'edit', data: item })}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, type: 'item', id: item.id })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Package Discounts Tab */}
            <TabsContent value="discounts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Package Discounts</CardTitle>
                    <CardDescription>Manage discounts for multiple visit packages</CardDescription>
                  </div>
                  <Button onClick={() => setDiscountDialog({ open: true, mode: 'add' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Discount
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Number of Visits</TableHead>
                        <TableHead>Discount (%)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packageDiscounts?.map((discount) => (
                        <TableRow key={discount.id}>
                          <TableCell>{discount.visits} visits</TableCell>
                          <TableCell>{discount.discountPercentage}%</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDiscountDialog({ open: true, mode: 'edit', data: discount })}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, type: 'discount', id: discount.id })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Bedroom Tier Dialog */}
        <Dialog open={bedroomDialog.open} onOpenChange={(open) => setBedroomDialog({ ...bedroomDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{bedroomDialog.mode === 'add' ? 'Add' : 'Edit'} Bedroom Tier</DialogTitle>
              <DialogDescription>
                {bedroomDialog.mode === 'add' ? 'Create a new' : 'Update the'} bedroom-based pricing tier
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const bedrooms = parseInt(formData.get('bedrooms') as string);
                const price = Math.round(parseFloat(formData.get('price') as string) * 100);
                
                if (bedroomDialog.mode === 'add') {
                  createBedroomTier.mutate({ serviceId: selectedServiceId!, bedrooms, price });
                } else {
                  updateBedroomTier.mutate({ id: bedroomDialog.data.id, bedrooms, price });
                }
              }}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="1"
                    defaultValue={bedroomDialog.data?.bedrooms}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (EGP)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={bedroomDialog.data ? (bedroomDialog.data.price / 100).toFixed(2) : ''}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBedroomDialog({ open: false, mode: 'add' })}>
                  Cancel
                </Button>
                <Button type="submit">
                  {bedroomDialog.mode === 'add' ? 'Create' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Square Meter Dialog */}
        <Dialog open={sqmDialog.open} onOpenChange={(open) => setSqmDialog({ ...sqmDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{sqmDialog.mode === 'add' ? 'Add' : 'Edit'} Square Meter Pricing</DialogTitle>
              <DialogDescription>
                {sqmDialog.mode === 'add' ? 'Create new' : 'Update'} square meter-based pricing
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const variant = formData.get('variant') as string;
                const pricePerSqm = Math.round(parseFloat(formData.get('pricePerSqm') as string) * 100);
                const minimumCharge = Math.round(parseFloat(formData.get('minimumCharge') as string) * 100);
                
                if (sqmDialog.mode === 'add') {
                  createSqmPricing.mutate({ serviceId: selectedServiceId!, variant, pricePerSqm, minimumCharge });
                } else {
                  updateSqmPricing.mutate({ id: sqmDialog.data.id, variant, pricePerSqm, minimumCharge });
                }
              }}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant (optional)</Label>
                  <Input
                    id="variant"
                    name="variant"
                    placeholder="e.g., Normal, Heavy"
                    defaultValue={sqmDialog.data?.variant}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerSqm">Price per sqm (EGP)</Label>
                  <Input
                    id="pricePerSqm"
                    name="pricePerSqm"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={sqmDialog.data ? (sqmDialog.data.pricePerSqm / 100).toFixed(2) : ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumCharge">Minimum Charge (EGP)</Label>
                  <Input
                    id="minimumCharge"
                    name="minimumCharge"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={sqmDialog.data ? (sqmDialog.data.minimumCharge / 100).toFixed(2) : ''}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSqmDialog({ open: false, mode: 'add' })}>
                  Cancel
                </Button>
                <Button type="submit">
                  {sqmDialog.mode === 'add' ? 'Create' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Upholstery Item Dialog */}
        <Dialog open={itemDialog.open} onOpenChange={(open) => setItemDialog({ ...itemDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{itemDialog.mode === 'add' ? 'Add' : 'Edit'} Upholstery Item</DialogTitle>
              <DialogDescription>
                {itemDialog.mode === 'add' ? 'Create a new' : 'Update the'} upholstery item pricing
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const itemName = formData.get('itemName') as string;
                const itemNameEn = formData.get('itemNameEn') as string;
                const price = Math.round(parseFloat(formData.get('price') as string) * 100);
                
                if (itemDialog.mode === 'add') {
                  createUpholsteryItem.mutate({ serviceId: selectedServiceId!, itemName, itemNameEn, price });
                } else {
                  updateUpholsteryItem.mutate({ id: itemDialog.data.id, itemName, itemNameEn, price });
                }
              }}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name (Arabic)</Label>
                  <Input
                    id="itemName"
                    name="itemName"
                    defaultValue={itemDialog.data?.itemName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itemNameEn">Item Name (English)</Label>
                  <Input
                    id="itemNameEn"
                    name="itemNameEn"
                    defaultValue={itemDialog.data?.itemNameEn}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (EGP)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={itemDialog.data ? (itemDialog.data.price / 100).toFixed(2) : ''}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setItemDialog({ open: false, mode: 'add' })}>
                  Cancel
                </Button>
                <Button type="submit">
                  {itemDialog.mode === 'add' ? 'Create' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Package Discount Dialog */}
        <Dialog open={discountDialog.open} onOpenChange={(open) => setDiscountDialog({ ...discountDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{discountDialog.mode === 'add' ? 'Add' : 'Edit'} Package Discount</DialogTitle>
              <DialogDescription>
                {discountDialog.mode === 'add' ? 'Create a new' : 'Update the'} package discount
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const visits = parseInt(formData.get('visits') as string);
                const discountPercentage = parseInt(formData.get('discountPercentage') as string);
                
                if (discountDialog.mode === 'add') {
                  createPackageDiscount.mutate({ serviceId: selectedServiceId!, visits, discountPercentage });
                } else {
                  updatePackageDiscount.mutate({ id: discountDialog.data.id, visits, discountPercentage });
                }
              }}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="visits">Number of Visits</Label>
                  <Input
                    id="visits"
                    name="visits"
                    type="number"
                    min="1"
                    defaultValue={discountDialog.data?.visits}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                  <Input
                    id="discountPercentage"
                    name="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={discountDialog.data?.discountPercentage}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDiscountDialog({ open: false, mode: 'add' })}>
                  Cancel
                </Button>
                <Button type="submit">
                  {discountDialog.mode === 'add' ? 'Create' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this pricing record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, type: '', id: null })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
