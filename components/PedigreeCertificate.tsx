'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Printer, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type PedigreeAnimal = {
  id: string;
  ear_tag: string;
  name: string | null;
  breed: string;
  registration_number: string | null;
  birth_date?: string;
};

type PedigreeData = {
  piglet: {
    id: string;
    name: string | null;
    ear_tag: string;
    sex: string;
    birth_weight: number;
    weaning_weight: number | null;
    registration_number: string | null;
    registration_association: string | null;
    birth_date: string;
  };
  sire: PedigreeAnimal | null;
  dam: PedigreeAnimal | null;
  paternalGrandsire: PedigreeAnimal | null;
  paternalGranddam: PedigreeAnimal | null;
  maternalGrandsire: PedigreeAnimal | null;
  maternalGranddam: PedigreeAnimal | null;
};

type PedigreeCertificateProps = {
  pigletId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function PedigreeCertificate({
  pigletId,
  isOpen,
  onClose,
}: PedigreeCertificateProps) {
  const [loading, setLoading] = useState(false);
  const [pedigreeData, setPedigreeData] = useState<PedigreeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [farmName, setFarmName] = useState<string>('');
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && pigletId) {
      fetchPedigreeData();
      fetchFarmSettings();
    }
  }, [isOpen, pigletId]);

  const fetchFarmSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('farm_settings')
        .select('farm_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data?.farm_name) {
        setFarmName(data.farm_name);
      }
    } catch (err) {
      console.error('Error fetching farm settings:', err);
    }
  };

  const fetchPedigreeData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get piglet with basic info
      const { data: piglet, error: pigletError } = await supabase
        .from('piglets')
        .select('id, name, ear_tag, sex, birth_weight, weaning_weight, registration_number, registration_association, sire_id, dam_id, farrowing_id')
        .eq('id', pigletId)
        .single();

      if (pigletError) throw pigletError;

      // Get birth date from farrowing record
      let birthDate = null;
      if (piglet.farrowing_id) {
        const { data: farrowing } = await supabase
          .from('farrowings')
          .select('actual_farrowing_date')
          .eq('id', piglet.farrowing_id)
          .single();

        birthDate = farrowing?.actual_farrowing_date || null;
      }

      // Get sire (father)
      let sire = null;
      let paternalGrandsire = null;
      let paternalGranddam = null;

      if (piglet.sire_id) {
        const { data: sireData } = await supabase
          .from('boars')
          .select('id, ear_tag, name, breed, registration_number, birth_date, sire_id, dam_id')
          .eq('id', piglet.sire_id)
          .single();

        sire = sireData;

        // Get paternal grandparents
        if (sireData?.sire_id) {
          const { data: pgSire } = await supabase
            .from('boars')
            .select('id, ear_tag, name, breed, registration_number, birth_date')
            .eq('id', sireData.sire_id)
            .single();
          paternalGrandsire = pgSire;
        }

        if (sireData?.dam_id) {
          const { data: pgDam } = await supabase
            .from('sows')
            .select('id, ear_tag, name, breed, registration_number, birth_date')
            .eq('id', sireData.dam_id)
            .single();
          paternalGranddam = pgDam;
        }
      }

      // Get dam (mother)
      let dam = null;
      let maternalGrandsire = null;
      let maternalGranddam = null;

      if (piglet.dam_id) {
        const { data: damData } = await supabase
          .from('sows')
          .select('id, ear_tag, name, breed, registration_number, birth_date, sire_id, dam_id')
          .eq('id', piglet.dam_id)
          .single();

        dam = damData;

        // Get maternal grandparents
        if (damData?.sire_id) {
          const { data: mgSire } = await supabase
            .from('boars')
            .select('id, ear_tag, name, breed, registration_number, birth_date')
            .eq('id', damData.sire_id)
            .single();
          maternalGrandsire = mgSire;
        }

        if (damData?.dam_id) {
          const { data: mgDam } = await supabase
            .from('sows')
            .select('id, ear_tag, name, breed, registration_number, birth_date')
            .eq('id', damData.dam_id)
            .single();
          maternalGranddam = mgDam;
        }
      }

      setPedigreeData({
        piglet: {
          ...piglet,
          birth_date: birthDate,
        },
        sire,
        dam,
        paternalGrandsire,
        paternalGranddam,
        maternalGrandsire,
        maternalGranddam,
      });
    } catch (err: any) {
      console.error('Error fetching pedigree:', err);
      setError(err.message || 'Failed to load pedigree information');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAnimalCard = (
    animal: PedigreeAnimal | null,
    label: string,
    generation: number
  ) => {
    const widthClass = generation === 1 ? 'w-64' : generation === 2 ? 'w-56' : 'w-48';

    return (
      <div className={`${widthClass} border-2 border-gray-800 rounded-md p-3 bg-white`}>
        <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
          {label}
        </div>
        {animal ? (
          <div className="space-y-1">
            <div className="font-bold text-sm">{animal.name || animal.ear_tag}</div>
            {animal.name && (
              <div className="text-xs text-gray-600">Ear Tag: {animal.ear_tag}</div>
            )}
            <div className="text-xs text-gray-700">Breed: {animal.breed}</div>
            {animal.registration_number && (
              <div className="text-xs text-gray-700">
                Reg: {animal.registration_number}
              </div>
            )}
            {animal.birth_date && (
              <div className="text-xs text-gray-600">
                DOB: {formatDate(animal.birth_date)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">Not recorded</div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto print:bg-white print:relative print:block">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto print:shadow-none print:rounded-none print:max-w-full print:max-h-full">
        {/* Header - Hidden when printing */}
        <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between print:hidden">
          <h2 className="text-2xl font-bold text-gray-900">Pedigree Certificate</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={certificateRef} className="p-8 print:p-12">
          {loading && (
            <div className="text-center py-12 text-gray-600">
              Loading pedigree information...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!loading && !error && pedigreeData && (
            <div className="space-y-8">
              {/* Certificate Header */}
              <div className="text-center border-b-4 border-gray-800 pb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  PEDIGREE CERTIFICATE
                </h1>
                {farmName && (
                  <div className="text-xl text-gray-700 font-semibold">{farmName}</div>
                )}
                <div className="text-sm text-gray-600 mt-2">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              {/* Piglet Information */}
              <div className="bg-gray-50 border-2 border-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Animal Information</h3>

                {/* Show name prominently if it exists */}
                {pedigreeData.piglet.name && (
                  <div className="mb-4 pb-4 border-b border-gray-300">
                    <div className="text-2xl font-bold text-gray-900">
                      {pedigreeData.piglet.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Ear Tag: {pedigreeData.piglet.ear_tag || 'N/A'}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Only show ear tag here if no name */}
                  {!pedigreeData.piglet.name && (
                    <div>
                      <span className="font-semibold">Ear Tag:</span>{' '}
                      {pedigreeData.piglet.ear_tag || 'N/A'}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Sex:</span>{' '}
                    {pedigreeData.piglet.sex
                      ? pedigreeData.piglet.sex.charAt(0).toUpperCase() +
                        pedigreeData.piglet.sex.slice(1)
                      : 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Birth Date:</span>{' '}
                    {formatDate(pedigreeData.piglet.birth_date)}
                  </div>
                  <div>
                    <span className="font-semibold">Birth Weight:</span>{' '}
                    {pedigreeData.piglet.birth_weight
                      ? `${pedigreeData.piglet.birth_weight} kg`
                      : 'N/A'}
                  </div>
                  {pedigreeData.piglet.weaning_weight && (
                    <div>
                      <span className="font-semibold">Weaning Weight:</span>{' '}
                      {pedigreeData.piglet.weaning_weight} kg
                    </div>
                  )}
                  {pedigreeData.piglet.registration_number && (
                    <>
                      <div>
                        <span className="font-semibold">Registration #:</span>{' '}
                        {pedigreeData.piglet.registration_number}
                      </div>
                      {pedigreeData.piglet.registration_association && (
                        <div>
                          <span className="font-semibold">Association:</span>{' '}
                          {pedigreeData.piglet.registration_association}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Pedigree Chart - Vertical Family Tree */}
              <div>
                <h3 className="text-xl font-bold mb-6 text-gray-900">Three Generation Pedigree</h3>

                <div className="flex flex-col items-center">
                  {/* Subject Animal - Top */}
                  <div className="mb-8">
                    <div className="border-4 border-red-700 rounded-lg p-4 bg-red-50 shadow-lg" style={{ minWidth: '280px' }}>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-red-700 uppercase mb-2">
                          Subject Animal
                        </div>
                        {pedigreeData.piglet.name ? (
                          <>
                            <div className="font-bold text-lg text-gray-900">{pedigreeData.piglet.name}</div>
                            <div className="text-sm text-gray-600">Ear Tag: {pedigreeData.piglet.ear_tag}</div>
                          </>
                        ) : (
                          <div className="font-bold text-lg text-gray-900">{pedigreeData.piglet.ear_tag}</div>
                        )}
                        {pedigreeData.piglet.registration_number && (
                          <div className="text-xs text-red-700 mt-1">
                            Reg: {pedigreeData.piglet.registration_number}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Connecting line down */}
                    <div className="w-0.5 h-8 bg-gray-800 mx-auto"></div>
                  </div>

                  {/* Parents - Generation 1 */}
                  <div className="relative mb-8">
                    {/* Horizontal line connecting parents */}
                    <div className="absolute top-0 left-1/2 w-96 h-0.5 bg-gray-800 -translate-x-1/2"></div>
                    {/* Vertical lines down to parents */}
                    <div className="absolute top-0 left-1/4 w-0.5 h-8 bg-gray-800"></div>
                    <div className="absolute top-0 right-1/4 w-0.5 h-8 bg-gray-800"></div>

                    <div className="flex gap-8 pt-8">
                      {/* Sire */}
                      <div className="flex flex-col items-center">
                        {renderAnimalCard(pedigreeData.sire, 'Sire (Father)', 1)}
                        {/* Line down to grandparents */}
                        <div className="w-0.5 h-8 bg-gray-800"></div>
                      </div>

                      {/* Dam */}
                      <div className="flex flex-col items-center">
                        {renderAnimalCard(pedigreeData.dam, 'Dam (Mother)', 1)}
                        {/* Line down to grandparents */}
                        <div className="w-0.5 h-8 bg-gray-800"></div>
                      </div>
                    </div>
                  </div>

                  {/* Grandparents - Generation 2 */}
                  <div className="flex gap-8">
                    {/* Paternal Grandparents */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        {/* Horizontal line connecting paternal grandparents */}
                        <div className="absolute top-0 left-1/2 w-64 h-0.5 bg-gray-800 -translate-x-1/2"></div>
                        {/* Vertical lines down to grandparents */}
                        <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-gray-800"></div>
                        <div className="absolute top-0 right-1/4 w-0.5 h-6 bg-gray-800"></div>

                        <div className="flex gap-4 pt-6">
                          {renderAnimalCard(pedigreeData.paternalGrandsire, "Sire's Sire", 2)}
                          {renderAnimalCard(pedigreeData.paternalGranddam, "Sire's Dam", 2)}
                        </div>
                      </div>
                    </div>

                    {/* Maternal Grandparents */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        {/* Horizontal line connecting maternal grandparents */}
                        <div className="absolute top-0 left-1/2 w-64 h-0.5 bg-gray-800 -translate-x-1/2"></div>
                        {/* Vertical lines down to grandparents */}
                        <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-gray-800"></div>
                        <div className="absolute top-0 right-1/4 w-0.5 h-6 bg-gray-800"></div>

                        <div className="flex gap-4 pt-6">
                          {renderAnimalCard(pedigreeData.maternalGrandsire, "Dam's Sire", 2)}
                          {renderAnimalCard(pedigreeData.maternalGranddam, "Dam's Dam", 2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-600 border-t pt-6 mt-8">
                <p>
                  This pedigree certificate is based on records maintained in the farm management system.
                </p>
                <p className="mt-2">
                  Generated on {new Date().toLocaleDateString()} from Sow Tracker
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed > div,
          .fixed > div * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
          }
        }
      `}</style>
    </div>
  );
}
