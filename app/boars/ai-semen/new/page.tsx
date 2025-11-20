'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Beaker } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';

export default function AddAISemenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ear_tag: '',
    name: '',
    birth_date: '',
    breed: '',
    semen_straws: '',
    supplier: '',
    collection_date: '',
    cost_per_straw: '',
    registration_number: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to add AI semen');
        setLoading(false);
        return;
      }

      // Generate ear tag if not provided
      let earTag = formData.ear_tag.trim();
      if (!earTag) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        earTag = `AI-${date}-${random}`;
      }

      // Insert the AI semen record
      const { error: insertError } = await supabase
        .from('boars')
        .insert([{
          user_id: user.id,
          ear_tag: earTag,
          name: formData.name || null,
          birth_date: formData.birth_date || new Date().toISOString().split('T')[0], // Default to today if not provided
          breed: formData.breed,
          boar_type: 'ai_semen',
          status: 'active',
          semen_straws: formData.semen_straws ? parseInt(formData.semen_straws) : null,
          supplier: formData.supplier || null,
          collection_date: formData.collection_date || null,
          cost_per_straw: formData.cost_per_straw ? parseFloat(formData.cost_per_straw) : null,
          registration_number: formData.registration_number || null,
          notes: formData.notes || null,
        }]);

      if (insertError) throw insertError;

      toast.success('AI Semen added successfully!');
      router.push('/boars');
    } catch (err: any) {
      if (err.message?.includes('duplicate key') || err.code === '23505') {
        setError(`Identifier "${formData.ear_tag}" is already in use. Please use a different one or leave it blank to auto-generate.`);
      } else {
        setError(err.message || 'Failed to add AI semen');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Beaker className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Add AI Semen</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/boars">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Boar List
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add AI Semen Inventory</CardTitle>
            <CardDescription>
              Track purchased semen for artificial insemination breeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-800">
                  <strong>Tip:</strong> Enter the name and details of the boar from which the semen was collected.
                  This information will be used for pedigree tracking.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Boar Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Champion Duke, Maximus Prime"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Name of the boar from which semen was collected
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ear_tag">Inventory Identifier</Label>
                <Input
                  id="ear_tag"
                  name="ear_tag"
                  value={formData.ear_tag}
                  onChange={handleChange}
                  placeholder="e.g., AI-DUKE-001 (leave blank to auto-generate)"
                />
                <p className="text-sm text-muted-foreground">
                  Optional - unique identifier will be auto-generated if not provided
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">
                  Breed <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="e.g., Yorkshire, Landrace, Duroc"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semen_straws">
                    Number of Straws <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="semen_straws"
                    name="semen_straws"
                    type="number"
                    min="0"
                    value={formData.semen_straws}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Straws purchased
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_per_straw">Cost per Straw</Label>
                  <Input
                    id="cost_per_straw"
                    name="cost_per_straw"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_straw}
                    onChange={handleChange}
                    placeholder="e.g., 50.00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional - for cost tracking
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="e.g., Premium Genetics Inc, Elite Swine Genetics"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Company or person who sold the semen
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collection_date">Collection Date</Label>
                  <Input
                    id="collection_date"
                    name="collection_date"
                    type="date"
                    value={formData.collection_date}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    When semen was collected
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Boar Birth Date</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional - for pedigree records
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="Boar's registration number (optional)"
                />
                <p className="text-sm text-muted-foreground">
                  For registered purebred boars only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g., Grand Champion - National Show 2023. Excellent muscling and structure."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Show wins, genetic traits, offspring quality, etc.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adding AI Semen...' : 'Add AI Semen'}
                </Button>
                <Link href="/boars">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
