'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Check auth
      testResults.user = {
        id: user?.id,
        email: user?.email,
        status: user ? 'Authenticated' : 'Not authenticated'
      };

      // Test 2: Check organization_members
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user?.id);

      testResults.membership = {
        data: membership,
        error: membershipError?.message,
        count: membership?.length || 0
      };

      // Test 3: Check organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*');

      testResults.organizations = {
        data: orgs,
        error: orgsError?.message,
        count: orgs?.length || 0
      };

      // Test 4: Check view
      const { data: viewData, error: viewError } = await supabase
        .from('organization_members_with_email')
        .select('*')
        .limit(5);

      testResults.view = {
        data: viewData,
        error: viewError?.message,
        count: viewData?.length || 0
      };

      // Test 5: Try the lookup function
      if (user?.email) {
        const { data: lookupData, error: lookupError } = await supabase
          .rpc('lookup_user_by_email', { user_email: user.email });

        testResults.lookup = {
          data: lookupData,
          error: lookupError?.message
        };
      }

    } catch (error: any) {
      testResults.error = error.message;
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runTests();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Debug Page</h1>

        <Button onClick={runTests} disabled={loading} className="mb-6">
          {loading ? 'Running Tests...' : 'Run Tests Again'}
        </Button>

        <div className="bg-white rounded-lg shadow p-6">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
