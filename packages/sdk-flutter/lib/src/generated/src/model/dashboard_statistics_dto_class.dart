//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/dashboard_statistics_dto_class_top_labels_inner.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dashboard_statistics_dto_class.g.dart';

/// DashboardStatisticsDtoClass
///
/// Properties:
/// * [documentsTotal] 
/// * [byStatus] 
/// * [labelsAssignedCount] 
/// * [unlabeledCount] 
/// * [topLabels] 
@BuiltValue()
abstract class DashboardStatisticsDtoClass implements Built<DashboardStatisticsDtoClass, DashboardStatisticsDtoClassBuilder> {
  @BuiltValueField(wireName: r'documentsTotal')
  num get documentsTotal;

  @BuiltValueField(wireName: r'byStatus')
  BuiltMap<String, num> get byStatus;

  @BuiltValueField(wireName: r'labelsAssignedCount')
  num get labelsAssignedCount;

  @BuiltValueField(wireName: r'unlabeledCount')
  num get unlabeledCount;

  @BuiltValueField(wireName: r'topLabels')
  BuiltList<DashboardStatisticsDtoClassTopLabelsInner> get topLabels;

  DashboardStatisticsDtoClass._();

  factory DashboardStatisticsDtoClass([void updates(DashboardStatisticsDtoClassBuilder b)]) = _$DashboardStatisticsDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DashboardStatisticsDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DashboardStatisticsDtoClass> get serializer => _$DashboardStatisticsDtoClassSerializer();
}

class _$DashboardStatisticsDtoClassSerializer implements PrimitiveSerializer<DashboardStatisticsDtoClass> {
  @override
  final Iterable<Type> types = const [DashboardStatisticsDtoClass, _$DashboardStatisticsDtoClass];

  @override
  final String wireName = r'DashboardStatisticsDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DashboardStatisticsDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentsTotal';
    yield serializers.serialize(
      object.documentsTotal,
      specifiedType: const FullType(num),
    );
    yield r'byStatus';
    yield serializers.serialize(
      object.byStatus,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType(num)]),
    );
    yield r'labelsAssignedCount';
    yield serializers.serialize(
      object.labelsAssignedCount,
      specifiedType: const FullType(num),
    );
    yield r'unlabeledCount';
    yield serializers.serialize(
      object.unlabeledCount,
      specifiedType: const FullType(num),
    );
    yield r'topLabels';
    yield serializers.serialize(
      object.topLabels,
      specifiedType: const FullType(BuiltList, [FullType(DashboardStatisticsDtoClassTopLabelsInner)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DashboardStatisticsDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DashboardStatisticsDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentsTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.documentsTotal = valueDes;
          break;
        case r'byStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType(num)]),
          ) as BuiltMap<String, num>;
          result.byStatus.replace(valueDes);
          break;
        case r'labelsAssignedCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.labelsAssignedCount = valueDes;
          break;
        case r'unlabeledCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.unlabeledCount = valueDes;
          break;
        case r'topLabels':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DashboardStatisticsDtoClassTopLabelsInner)]),
          ) as BuiltList<DashboardStatisticsDtoClassTopLabelsInner>;
          result.topLabels.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DashboardStatisticsDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DashboardStatisticsDtoClassBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

