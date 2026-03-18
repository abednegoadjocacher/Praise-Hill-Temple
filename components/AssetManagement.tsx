import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Save, X, TrendingUp, Calendar, FolderTree, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import {Asset, AssetCategory} from "@/interface";

export default function AssetManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [assets, setAssets] = useState<Asset[]>([]);

  const [newAsset, setNewAsset] = useState<Omit<Asset, 'id'>>({
    name: '',
    category: 'Building',
    purchaseDate: '',
    purchaseValue: 0,
    currentValue: 0,
    condition: 'Excellent',
    location: '',
    description: '',
    quantity: 1,
  });

  const [editForm, setEditForm] = useState<Asset | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
        const [assetRes, catRes] = await Promise.all([
            fetch('/api/assets'),
            fetch('/api/asset-categories')
        ]);
        setAssets(await assetRes.json());
        setCategories(await catRes.json());
    } finally {
        setIsLoading(false);
    }
};

  useEffect(() => {
      fetchData();
  }, []);


  const handleAddAsset = async () => {
  // 1. Validation check
  if (!newAsset.name || !newAsset.purchaseDate || !newAsset.purchaseValue || !newAsset.location) {
    alert('Please fill in all required fields');
    return;
  }

  setIsSubmitting(true); // Start loading

  try {
    const response = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAsset),
    });

    if (response.ok) {
      await fetchData(); // Refresh the list from the DB
      setShowAddModal(false);
      setNewAsset({
        name: '',
        category: categories.length > 0 ? categories[0].name : 'Building',
        purchaseDate: '',
        purchaseValue: 0,
        currentValue: 0,
        condition: 'Excellent',
        location: '',
        description: '',
        quantity: 1,
      });
    } else {
      alert('Failed to save asset to the database.');
    }
  } catch (error) {
    console.error("Save error:", error);
    alert('A network error occurred.');
  } finally {
    setIsSubmitting(false); // Stop loading regardless of success or failure
  }
};

const handleSaveAsset = async () => {
  if (!editForm) return;

  setIsSubmitting(true); // Start the loading effect

  try {
    const response = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });

    if (response.ok) {
      await fetchData(); // Refresh the list from the database
      setEditingAssetId(null);
      setEditForm(null);
      alert('Asset updated successfully!');
    } else {
      alert('Failed to update the asset in the database.');
    }
  } catch (error) {
    console.error("Update error:", error);
    alert('A network error occurred while saving.');
  } finally {
    setIsSubmitting(false); // Stop the loading effect
  }
};


  //   if (!newAsset.name || !newAsset.purchaseDate || !newAsset.purchaseValue || !newAsset.location) {
  //     alert('Please fill in all required fields: Name, Purchase Date, Purchase Value, and Location');
  //     return;
  //   }

  //   const asset: Asset = {
  //     id: assets.length + 1,
  //     ...newAsset,
  //     currentValue: newAsset.currentValue || newAsset.purchaseValue,
  //     quantity: newAsset.quantity || 1,
  //   };

  //   setAssets([...assets, asset]);
  //   setNewAsset({
  //     name: '',
  //     category: 'Building',
  //     purchaseDate: '',
  //     purchaseValue: 0,
  //     currentValue: 0,
  //     condition: 'Excellent',
  //     location: '',
  //     description: '',
  //     quantity: 1,
  //   });
  //   setShowAddModal(false);
  //   alert('Asset added successfully!');
  // };

  const handleEditAsset = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setEditForm({ ...asset });
  };

  const handleCancelEdit = () => {
    setEditingAssetId(null);
    setEditForm(null);
  };

  const handleDeleteAsset = async (id: number) => {
  const asset = assets.find(a => a.id === id);
  if (!window.confirm(`Are you sure you want to remove "${asset?.name}"?`)) return;

  setDeletingAssetId(id); // Set the specific ID being deleted

  try {
    const response = await fetch(`/api/assets?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      setAssets(assets.filter(a => a.id !== id));
    } else {
      alert('Failed to delete asset from database.');
    }
  } catch (error) {
    console.error("Delete error:", error);
  } finally {
    setDeletingAssetId(null); // Reset loading state
  }
};

const handleAddCategory = async () => {
  if (!newCategory.name || !newCategory.code) {
    alert('Please fill in both Category Name and Code');
    return;
  }

  // Check if code already exists locally before hitting the DB
  if (categories.some(cat => cat.code.toUpperCase() === newCategory.code.toUpperCase())) {
    alert('This code already exists. Please use a unique code.');
    return;
  }

  setIsCreatingCategory(true); // Start loading

  try {
    const response = await fetch('/api/asset-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCategory.name,
        code: newCategory.code.toUpperCase()
      }),
    });

    if (response.ok) {
      await fetchData(); // Refresh the list so the new category appears in dropdowns
      setNewCategory({ name: '', code: '' });
      alert('Category added successfully!');
    } else {
      const errorData = await response.json();
      alert(errorData.error || 'Failed to add category');
    }
  } catch (error) {
    console.error("Category creation error:", error);
    alert('Network error while creating category');
  } finally {
    setIsCreatingCategory(false); // Stop loading
  }
};
  
const handleDeleteCategory = async (id: number) => {
  const category = categories.find(c => c.id === id);
  
  const assetsUsingCategory = assets.filter(a => a.category === category?.name);
  if (assetsUsingCategory.length > 0) {
    alert(`Cannot delete: ${assetsUsingCategory.length} asset(s) are using this category.`);
    return;
  }

  if (!window.confirm(`Delete category "${category?.name}"?`)) return;

  setDeletingCategoryId(id); // Start loading for this specific category

  try {
    const response = await fetch(`/api/asset-categories?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      setCategories(categories.filter(c => c.id !== id));
    }
  } catch (error) {
    console.error("Category delete error:", error);
  } finally {
    setDeletingCategoryId(null);
  }
};
  const filteredAssets = assets.filter(asset => {
  // Use ?? '' to provide an empty string if the value is null or undefined
  const name = asset.name?.toLowerCase() ?? '';
  const description = asset.description?.toLowerCase() ?? '';
  const location = asset.location?.toLowerCase() ?? '';
  const search = searchTerm.toLowerCase();

  const matchesSearch = name.includes(search) || 
                        description.includes(search) || 
                        location.includes(search);

  const matchesCategory = filterCategory === 'All' || asset.category === filterCategory;
  
  return matchesSearch && matchesCategory;
});

  const totalAssets = assets.reduce((sum, asset) => sum + asset.quantity, 0);
  const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue * asset.quantity), 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchaseValue * asset.quantity), 0);
  const recentAdditions = assets.filter(asset => {
    const purchaseDate = new Date(asset.purchaseDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return purchaseDate >= thirtyDaysAgo;
  }).length;

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return 'bg-green-50 text-green-700';
      case 'Good':
        return 'bg-blue-50 text-blue-700';
      case 'Fair':
        return 'bg-yellow-50 text-yellow-700';
      case 'Poor':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const exportToExcel = () => {
    // Group assets by category
    const assetsByCategory: Record<string, Asset[]> = {};
    assets.forEach(asset => {
      if (!assetsByCategory[asset.category]) {
        assetsByCategory[asset.category] = [];
      }
      assetsByCategory[asset.category].push(asset);
    });

    // Create worksheet data with proper structure
    const wsData: any[] = [];
    
    // Add header row
    wsData.push([
      'Asset Class',
      'Date of Acquisition',
      'Asset details',
      'Asset code',
      'Cost',
      'condition',
      'Date disposed/scrapped',
      'Asset location'
    ]);

    let totalCost = 0;

    // Add data rows grouped by category
    Object.entries(assetsByCategory).forEach(([category, categoryAssets]) => {
      categoryAssets.forEach((asset, index) => {
        // Get category code
        const categoryCode = categories.find(c => c.name === category)?.code || 'N/A';
        
        // Generate asset code based on category, location, and year
        const purchaseYear = new Date(asset.purchaseDate).getFullYear().toString().slice(-2);
        const assetCode = `${categoryCode}/PHT/${purchaseYear}/${String(asset.id).padStart(6, '0')}`;
        
        // Format date
        const formattedDate = new Date(asset.purchaseDate).toLocaleDateString('en-GB');
        
        // Calculate total cost (purchase value * quantity)
        const assetCost = asset.purchaseValue * asset.quantity;
        totalCost += assetCost;
        
        wsData.push([
          index === 0 ? category : '', // Show category only on first row of each group
          formattedDate,
          `${asset.name} - ${asset.description}`,
          assetCode,
          assetCost.toFixed(2),
          asset.condition,
          '', // Date disposed/scrapped (empty for now)
          asset.location
        ]);
      });
    });

    // Add empty row
    wsData.push(['', '', '', '', '', '', '', '']);
    
    // Add total row
    wsData.push(['', 'total', '', '', totalCost.toFixed(2), '', '', '']);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Asset Class
      { wch: 18 }, // Date of Acquisition
      { wch: 35 }, // Asset details
      { wch: 25 }, // Asset code
      { wch: 12 }, // Cost
      { wch: 12 }, // condition
      { wch: 20 }, // Date disposed/scrapped
      { wch: 25 }  // Asset location
    ];

    // Apply borders to all cells with data
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        ws[cellAddress].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };

        // Bold header row
        if (R === 0) {
          ws[cellAddress].s.font = { bold: true };
          ws[cellAddress].s.fill = { fgColor: { rgb: 'CCCCCC' } };
        }

        // Bold total row
        if (R === range.e.r && wsData[R] && wsData[R][1] === 'total') {
          ws[cellAddress].s.font = { bold: true };
        }
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Asset Report');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Church_Asset_Report_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading Church Assets...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 mb-2">Asset Management</h1>
            <p className="text-gray-600">Track and manage church properties and equipment</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Asset
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Total Assets</p>
            </div>
            <h3 className="text-3xl text-gray-900">{totalAssets}</h3>
            <p className="text-xs text-gray-500 mt-1">{assets.length} unique items</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <p className="w-7 h-5 text-blue-600">Ghc</p>
              </div>
              <p className="text-sm text-gray-600">Current Value</p>
            </div>
            <h3 className="text-3xl text-gray-900">Ghc {totalValue.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Total market value</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Purchase Value</p>
            </div>
            <h3 className="text-3xl text-gray-900">Ghc {totalPurchaseValue.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Original investment</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Recent Additions</p>
            </div>
            <h3 className="text-3xl text-gray-900">{recentAdditions}</h3>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
        </div>

        {/* Asset Classes */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FolderTree className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-gray-900">Asset classes</h2>
                <p className="text-sm text-gray-600">{categories.length} categories defined</p>
              </div>
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Manage Categories
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {categories.map((category) => (
                <li key={category.id} className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between">
                  <span className="text-gray-900">{category.name}</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{category.code}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-gray-900 mb-2">Asset Inventory</h2>
                <p className="text-sm text-gray-600">Complete list of all church assets</p>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search assets..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.code} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export to Excel
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Asset Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Purchase Value
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    {editingAssetId === asset.id && editForm ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                          >
                            {categories.map(cat => (
                              <option key={cat.code} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={editForm.purchaseDate}
                            onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.currentValue}
                            onChange={(e) => setEditForm({ ...editForm, currentValue: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>

                          <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.purchaseValue}
                            onChange={(e) => setEditForm({ ...editForm, purchaseValue: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.condition}
                            onChange={(e) => setEditForm({ ...editForm, condition: e.target.value as Asset['condition'] })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                          >
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveAsset}
                              disabled={isSubmitting} // Prevent multiple clicks
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                                isSubmitting 
                                  ? 'bg-blue-400 cursor-not-allowed text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  Save
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-900">{asset.name}</p>
                            <p className="text-xs text-gray-500">{asset.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-full">
                            {asset.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 text-sm">
                          {new Date(asset.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-900">Ghc {asset.currentValue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-900">Ghc {asset.purchaseValue.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-900">{asset.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getConditionColor(asset.condition)}`}>
                            {asset.condition}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 text-sm">{asset.location}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAsset(asset)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              disabled={deletingAssetId === asset.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:bg-red-400"
                            >
                              {deletingAssetId === asset.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              {deletingAssetId === asset.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAssets.length === 0 && (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No assets found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-green-700 bg-opacity-50 flex justify-center overflow-y-auto p-2 py-10 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 h-fit my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Add New Asset</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Projector"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAsset.category}
                  onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.code} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newAsset.purchaseDate}
                  onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Purchase Value (Ghc) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newAsset.purchaseValue || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, purchaseValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Current Value (Ghc)
                </label>
                <input
                  type="number"
                  value={newAsset.currentValue || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, currentValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Leave blank to use purchase value"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newAsset.quantity || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter quantity (e.g., 1, 5, 200)"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Condition <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAsset.condition}
                  onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value as Asset['condition'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAsset.location}
                  onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Main Sanctuary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Additional details about the asset..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddAsset}
                disabled={isSubmitting} // Disable while loading
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isSubmitting 
                    ? 'bg-green-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Asset...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Asset
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-green-700 bg-opacity-50 flex justify-center overflow-y-auto p-2 py-10 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 h-fit my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Manage 
                Categories</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Add New Category Form */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-gray-900 mb-4">Add New Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Office equipment"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Unique Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCategory.code}
                    onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., OFFEQ"
                    maxLength={10}
                  />
                </div>
              </div>
              <button
                onClick={handleAddCategory}
                disabled={isCreatingCategory} // Prevent double-clicks
                className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isCreatingCategory 
                    ? 'bg-green-400 cursor-not-allowed text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isCreatingCategory ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Category
                  </>
                )}
              </button>
            </div>

            {/* Existing Categories List */}
            <div>
              <h3 className="text-gray-900 mb-4">Existing Categories ({categories.length})</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-gray-600 uppercase tracking-wider">
                        Category Name
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-gray-600 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{category.name}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded font-mono">
                            {category.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={deletingCategoryId === category.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:bg-red-400"
                          >
                            {deletingCategoryId === category.id ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            {deletingCategoryId === category.id ? 'Removing...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}