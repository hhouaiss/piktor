/**
 * Test file to verify Supabase connection and basic operations
 * This file can be used to test the database connection after applying the migration
 */

import { supabase, supabaseService } from './index';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test 1: Basic connection
    const { data, error } = await supabase.from('users').select('count').single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection test failed: ${error.message}`);
    }
    console.log('✅ Basic connection successful');

    // Test 2: Test authentication
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id || 'No authenticated user');

    return {
      success: true,
      message: 'All connection tests passed',
      user: user?.id
    };

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return {
      success: false,
      message: (error as Error).message,
      user: null
    };
  }
}

export async function testDatabaseOperations(userId: string) {
  try {
    console.log('Testing database operations...');

    // Test 1: Create a test project
    const projectId = await supabaseService.createProject(userId, {
      name: 'Test Project',
      description: 'A test project for verification',
      category: 'test'
    });
    console.log('✅ Project creation successful:', projectId);

    // Test 2: Get the project
    const project = await supabaseService.getProject(projectId);
    if (!project) throw new Error('Failed to retrieve created project');
    console.log('✅ Project retrieval successful:', project.name);

    // Test 3: Create a test visual
    const visualId = await supabaseService.createVisual({
      userId,
      projectId,
      name: 'Test Visual',
      description: 'A test visual for verification',
      originalImageUrl: 'https://example.com/test.jpg',
      thumbnailUrl: 'https://example.com/test-thumb.jpg',
      downloadUrls: { instagram_post: 'https://example.com/test-ig.jpg' },
      prompt: 'A test visual prompt',
      style: 'modern',
      environment: 'neutral',
      format: ['instagram_post'],
      generationParams: { model: 'test' },
      tags: ['test', 'verification'],
      colors: ['#ffffff', '#000000'],
      dimensions: { width: 1024, height: 1024 },
      fileSize: 102400,
      mimeType: 'image/jpeg',
      views: 0,
      downloads: 0,
      shares: 0,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Visual creation successful:', visualId);

    // Test 4: Get user's projects
    const projectsResult = await supabaseService.getUserProjects(userId);
    console.log('✅ User projects retrieval successful:', projectsResult.data.length, 'projects found');

    // Test 5: Get user's visuals
    const visualsResult = await supabaseService.getUserVisuals(userId);
    console.log('✅ User visuals retrieval successful:', visualsResult.data.length, 'visuals found');

    // Test 6: Get dashboard stats
    const stats = await supabaseService.getDashboardStats(userId);
    console.log('✅ Dashboard stats successful:', stats);

    // Cleanup: Delete test data
    await supabaseService.deleteProject(projectId);
    console.log('✅ Cleanup successful');

    return {
      success: true,
      message: 'All database operation tests passed',
      testResults: {
        projectCreated: projectId,
        visualCreated: visualId,
        projectsCount: projectsResult.data.length,
        visualsCount: visualsResult.data.length,
        stats
      }
    };

  } catch (error) {
    console.error('❌ Database operation test failed:', error);
    return {
      success: false,
      message: (error as Error).message,
      testResults: null
    };
  }
}

// Example usage:
/*
import { testSupabaseConnection, testDatabaseOperations } from './test-connection';

async function runTests() {
  // Test connection
  const connectionResult = await testSupabaseConnection();
  console.log('Connection test result:', connectionResult);

  // Test database operations (requires authenticated user)
  if (connectionResult.success && connectionResult.user) {
    const operationResult = await testDatabaseOperations(connectionResult.user);
    console.log('Database operations test result:', operationResult);
  }
}

runTests();
*/